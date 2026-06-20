#!/usr/bin/env python3
"""Build interactive graph + tag index pages from the wiki source.

Walks docs/, parses frontmatter and wikilinks, and emits:
- docs/graph.md   : a Mermaid flowchart of all wiki pages and their links
- docs/tags.md    : a tag-based index of all pages

Run this after the wikilinks plugin has scanned the source. It re-reads the
files directly so it doesn't depend on the plugin's in-memory state.

Idempotent — safe to run on every build.
"""

from __future__ import annotations

import os
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

DOCS = Path(__file__).resolve().parent.parent / "docs"

WIKILINK_RE = re.compile(
    r"\[\["
    r"([^\]|#]+)"               # target
    r"(?:#([^\]|]+))?"          # heading
    r"(?:\|([^\]]+))?"          # display
    r"\]\]"
)
CODE_FENCE_RE = re.compile(r"```[\s\S]*?```")
CODE_SPAN_RE = re.compile(r"`[^`\n]+`")

TYPE_LABELS = {
    "concept": ("💡", "Concepts"),
    "comparison": ("⚖️", "Comparisons"),
    "entity": ("👤", "Entities"),
    "query": ("🔍", "Queries"),
    "summary": ("📄", "Sources"),
    "schema": ("⚙️", "Schema"),
    "meta": ("🛠️", "Meta"),
}


def parse_frontmatter(text):
    """Return (meta dict, body)."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 4)
    if end < 0:
        return {}, text
    fm = text[4:end]
    body = text[end + 5:]
    meta = {}
    for line in fm.splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        v = v.strip().strip("'\"")
        if v.startswith("[") and v.endswith("]"):
            meta[k.strip()] = [x.strip().strip("'\"") for x in v[1:-1].split(",") if x.strip()]
        else:
            meta[k.strip()] = v
    return meta, body


def extract_wikilinks(body):
    """Strip code spans/blocks, then yield all wikilink targets."""
    text = CODE_FENCE_RE.sub("", body)
    text = CODE_SPAN_RE.sub("", text)
    for m in WIKILINK_RE.finditer(text):
        yield m.group(1).strip()


def slugify(value):
    return value.strip().lower().replace(" ", "-")


def build_target_map():
    """Return {slug: {url, title, src_path, type, tags}}"""
    targets = {}
    for md in sorted(DOCS.rglob("*.md")):
        rel = md.relative_to(DOCS)
        if "raw" in rel.parts:
            continue
        text = md.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(text)
        parts = rel.with_suffix("").parts
        url_path = str(rel.with_suffix("")).replace(os.sep, "/")
        if url_path.endswith("/index"):
            url_path = url_path[:-5] or ""
        url = "/" + url_path + "/" if url_path else "/"

        slug_full = slugify("/".join(parts))
        slug_base = slugify(parts[-1])
        info = {
            "url": url,
            "title": meta.get("title") or parts[-1].replace("-", " ").title(),
            "src_path": str(rel),
            "type": meta.get("type", "page"),
            "tags": meta.get("tags", []) if isinstance(meta.get("tags"), list) else [],
        }
        targets[slug_full] = info
        targets.setdefault(slug_base, info)
    # Aliases
    if "index" not in targets and "catalog" in targets:
        targets["index"] = targets["catalog"]
    return targets


def build_edges(targets):
    """Yield (source_slug, target_slug) for each wikilink in each page."""
    edges = set()
    for md in sorted(DOCS.rglob("*.md")):
        rel = md.relative_to(DOCS)
        if "raw" in rel.parts:
            continue
        src_slug = slugify("/".join(rel.with_suffix("").parts))
        if src_slug.endswith("/index"):
            src_slug = src_slug[:-5]
        text = md.read_text(encoding="utf-8")
        _, body = parse_frontmatter(text)
        for target in extract_wikilinks(body):
            tgt_slug = slugify(target)
            if tgt_slug in targets and tgt_slug != src_slug:
                edges.add((src_slug, tgt_slug))
    return edges


def emit_graph_md(targets, edges):
    """Generate docs/graph.md with an interactive Mermaid diagram."""
    by_type = defaultdict(list)
    for slug, info in targets.items():
        if "/" not in slug:  # only top-level slug
            by_type[info["type"]].append((slug, info))

    lines = [
        "---",
        "title: Wiki Graph",
        "created: 2026-06-12",
        "updated: 2026-06-12",
        "type: meta",
        "tags: [meta, navigation, graph, interactive]",
        "sources: []",
        "---",
        "",
        "# Wiki Graph View",
        "",
        "An interactive map of every page in the wiki and how they connect.",
        "Hover over nodes to see the title; click to navigate.",
        "",
        "## How to read this",
        "",
        "- **Each box** is one wiki page.",
        "- **Each arrow** `A → B` means page A contains a `[[B]]` wikilink.",
        "- **Color & shape** group pages by type (concept, comparison, etc.).",
        "- **Click** a box to navigate to that page.",
        "- **Scroll** to zoom, **drag** to pan inside the diagram.",
        "",
        "## Full graph",
        "",
        "```mermaid",
        "graph LR",
        "  classDef concept fill:#7c4dff,stroke:#311b92,color:#fff",
        "  classDef comparison fill:#ff6e40,stroke:#bf360c,color:#fff",
        "  classDef entity fill:#26a69a,stroke:#00695c,color:#fff",
        "  classDef query fill:#42a5f5,stroke:#0d47a1,color:#fff",
        "  classDef summary fill:#ab47bc,stroke:#4a148c,color:#fff",
        "  classDef schema fill:#78909c,stroke:#263238,color:#fff",
        "  classDef meta fill:#9e9e9e,stroke:#212121,color:#fff",
        "",
    ]

    # Nodes
    seen = set()
    for slug, info in targets.items():
        if "/" in slug or slug in seen:
            continue
        seen.add(slug)
        node_id = re.sub(r"[^a-zA-Z0-9_]", "_", slug)
        label = info["title"].replace('"', "'").replace("[", "(").replace("]", ")")
        label = label[:40] + ("..." if len(label) > 40 else "")
        lines.append(f'  {node_id}["{label}"]:::{info["type"]}')
        lines.append(f"  click {node_id} \"{info['url']}\" \"Go to {info['title']}\"")

    # Edges
    lines.append("")
    for src, tgt in sorted(edges):
        src_id = re.sub(r"[^a-zA-Z0-9_]", "_", src)
        tgt_id = re.sub(r"[^a-zA-Z0-9_]", "_", tgt)
        lines.append(f"  {src_id} --> {tgt_id}")

    lines.extend([
        "",
        "```",
        "",
        "## Stats",
        "",
        f"- **{len([s for s in targets if '/' not in s])}** unique pages",
        f"- **{len(edges)}** wikilink connections",
        f"- **{sum(len(i['tags']) for s,i in targets.items() if '/' not in s)}** total tags",
        "",
        "## Pages by type",
        "",
    ])

    for ptype in ("concept", "comparison", "entity", "query", "summary", "schema", "meta"):
        items = by_type.get(ptype, [])
        if not items:
            continue
        emoji, label = TYPE_LABELS.get(ptype, ("•", ptype.title()))
        lines.append(f"### {emoji} {label} ({len(items)})")
        lines.append("")
        for slug, info in sorted(items, key=lambda x: x[1]["title"]):
            lines.append(f"- [{info['title']}]({info['url']})")
        lines.append("")

    lines.extend([
        "---",
        "",
        "## Related",
        "",
        "- [[catalog|Wiki Catalog]] — text-based listing of all pages",
        "- [[tags|Tag Index]] — browse by topic tag",
        "- [[llm-wiki-pattern]] — the pattern this wiki implements",
        "",
        "> This page is auto-generated from the wiki source. To regenerate,",
        "> run `python scripts/build_graph.py` or push a change that touches",
        "> wiki content — CI will rebuild and re-deploy.",
    ])

    (DOCS / "graph.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"graph.md: {len([s for s in targets if '/' not in s])} nodes, {len(edges)} edges")


def emit_tags_md(targets):
    """Generate docs/tags.md with all pages grouped by tag."""
    by_tag = defaultdict(list)
    for slug, info in targets.items():
        if "/" in slug:
            continue
        for tag in info["tags"]:
            by_tag[tag].append(info)

    lines = [
        "---",
        "title: Tag Index",
        "created: 2026-06-12",
        "updated: 2026-06-12",
        "type: meta",
        "tags: [meta, navigation, taxonomy]",
        "sources: []",
        "---",
        "",
        "# Tag Index",
        "",
        "Browse the wiki by topic tag. Tags come from the",
        "[[schema|tag taxonomy]] and appear in every page's frontmatter.",
        "",
        f"**{len(by_tag)}** tags · **{sum(len(v) for v in by_tag.values())}** page-tag pairs",
        "",
        "## All tags (chip cloud)",
        "",
    ]

    # Chip cloud
    for tag in sorted(by_tag.keys()):
        count = len(by_tag[tag])
        lines.append(f'[`{tag}` ({count})](#{tag.replace("_", "-")}-tag) ')

    lines.extend(["", "---", ""])

    # Detailed sections per tag
    for tag in sorted(by_tag.keys()):
        anchor = tag.replace("_", "-")
        lines.append(f"## `{tag}` tag")
        lines.append("")
        lines.append(f"{len(by_tag[tag])} page(s) tagged with `{tag}`:")
        lines.append("")
        for info in sorted(by_tag[tag], key=lambda x: x["title"]):
            tags_list = ", ".join(f"`{t}`" for t in info["tags"])
            lines.append(f"- [{info['title']}]({info['url']}) — {info['type']} — tags: {tags_list}")
        lines.append("")

    lines.extend([
        "---",
        "",
        "## Related",
        "",
        "- [[catalog|Wiki Catalog]] — full page listing",
        "- [[graph|Graph View]] — visual map of connections",
        "- [[schema|Schema]] — tag taxonomy definition",
    ])

    (DOCS / "tags.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"tags.md: {len(by_tag)} tags")


def main():
    targets = build_target_map()
    edges = build_edges(targets)
    emit_graph_md(targets, edges)
    emit_tags_md(targets)


if __name__ == "__main__":
    main()