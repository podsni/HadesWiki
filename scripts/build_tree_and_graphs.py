#!/usr/bin/env python3
"""
Generate two artifacts for the Obsidian-like UI:

  1. docs/assets/wiki-tree.json
     — full file tree (folders + files with metadata: tags, title, url, backlink count)

  2. docs/assets/local-graphs/<page-slug>.json
     — per-page local graph: 1-hop neighborhood (incoming + outgoing) for hover preview
       and JS-rendered local graph view

This runs offline (no MkDocs), scans `docs/` recursively, parses frontmatter,
and writes JSON files that `extra.js` loads at runtime.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from urllib.parse import quote

REPO = Path("/root/HadesWiki")
DOCS = REPO / "docs"
ASSETS = DOCS / "assets"
TREE_JSON = ASSETS / "wiki-tree.json"
LOCAL_GRAPHS_DIR = ASSETS / "local-graphs"


def parse_frontmatter(text: str) -> dict:
    """Extract YAML-ish frontmatter. Supports:
       - key: value
       - tags: [a, b, c]   (inline list)
       - tags:
           - a
           - b            (block list, simplified)
    """
    if not text.startswith("---"):
        return {}
    m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return {}
    raw = m.group(1)
    fm = {}

    # 1) Inline list form: `tags: [a, b, c]`
    for m2 in re.finditer(r"^(\w[\w_-]*):\s*\[([^\]]+)\]\s*$", raw, re.MULTILINE):
        key = m2.group(1)
        items = [t.strip().strip('"').strip("'") for t in m2.group(2).split(",") if t.strip()]
        fm[key] = items

    # 2) Block list form: `tags:\n  - a\n  - b`
    block_re = re.compile(r"^(\w[\w_-]*):\s*\n((?:\s+-\s+.+\n?)+)", re.MULTILINE)
    for m2 in block_re.finditer(raw):
        key = m2.group(1)
        if key in fm:  # already captured as inline
            continue
        items = re.findall(r"^\s+-\s+(.+)$", m2.group(2), re.MULTILINE)
        fm[key] = [t.strip().strip('"').strip("'") for t in items]

    # 3) Simple `key: value` form
    for line in raw.split("\n"):
        if ":" in line and not line.startswith(" ") and not line.startswith("#") and not line.startswith("-"):
            k, _, v = line.partition(":")
            k = k.strip()
            if k not in fm and not v.strip().startswith("["):
                fm[k] = v.strip().strip('"').strip("'")

    return fm


def title_from_filename(p: Path) -> str:
    """Convert 'llm-wiki-pattern.md' -> 'LLM Wiki Pattern'."""
    stem = p.stem
    parts = stem.replace("_", "-").split("-")
    titled = []
    for part in parts:
        if part.lower() in ("a", "an", "the", "and", "or", "of", "in", "to", "for", "vs"):
            titled.append(part.lower())
        else:
            titled.append(part.capitalize())
    s = " ".join(titled)
    return s.replace("Llm", "LLM").replace("Qmd", "QMD").replace("Rag", "RAG").replace("Vs ", "vs ")


def extract_wikilinks(text: str) -> set[str]:
    """Extract [[page-name]] or [[page-name|alias]] references, skipping code blocks."""
    # Strip code blocks first
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = re.sub(r"`[^`\n]+`", "", text)
    links = set()
    for m in re.finditer(r"\[\[([^\]|#]+)(?:[#\|][^\]]*)?\]\]", text):
        target = m.group(1).strip()
        # Normalize: if path-like, take basename without ext
        target = target.replace("\\", "/").split("/")[-1]
        target = re.sub(r"\.md$", "", target)
        links.add(target.lower())
    return links


def build_pages() -> list[dict]:
    """Walk docs/, parse each .md, extract metadata."""
    pages = []
    for md_path in sorted(DOCS.rglob("*.md")):
        rel = md_path.relative_to(DOCS)
        if rel.parts[0] in ("assets",):
            continue
        text = md_path.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        title = fm.get("title") or title_from_filename(md_path)
        # `tags` may be a list (parsed) or string (raw fallback)
        tags_raw = fm.get("tags", [])
        if isinstance(tags_raw, list):
            tags = [str(t).strip() for t in tags_raw if str(t).strip()]
        else:
            tags = [t.strip() for t in str(tags_raw).split(",") if t.strip()]
        # URL: docs/foo/bar.md -> foo/bar/ (MkDocs adds trailing slash for index.md -> /)
        url_rel = str(rel.with_suffix("")).replace("\\", "/")
        if url_rel == "index":
            url = "/"
        else:
            url = "/" + url_rel + "/"
        # Outgoing wikilinks
        outgoing = sorted(extract_wikilinks(text))
        pages.append({
            "path": str(rel),
            "slug": url_rel,
            "title": title,
            "url": url,
            "tags": tags,
            "outgoing": outgoing,
            "folder": str(rel.parent) if rel.parent != Path(".") else "",
        })
    return pages


def build_backlinks(pages: list[dict]) -> dict[str, list[dict]]:
    """For each page, list pages that link TO it."""
    # Build slug lookup
    by_slug = {}
    for p in pages:
        by_slug[p["slug"].lower()] = p
        # Also by basename
        base = p["slug"].lower().split("/")[-1]
        by_slug.setdefault(base, p)

    backlinks = defaultdict(list)
    for source in pages:
        for target_slug in source["outgoing"]:
            # Try to resolve target
            target_page = by_slug.get(target_slug)
            if target_page:
                backlinks[target_page["slug"]].append({
                    "slug": source["slug"],
                    "title": source["title"],
                    "url": source["url"],
                })
    return dict(backlinks)


def build_tree(pages: list[dict]) -> dict:
    """Build nested folder/file tree structure."""
    root = {"name": "HadesWiki", "type": "folder", "children": {}}

    for p in pages:
        parts = p["path"].split("/")
        # Skip the .md extension part
        parts[-1] = parts[-1][:-3]  # strip .md
        node = root
        for i, part in enumerate(parts):
            is_last = i == len(parts) - 1
            if is_last:
                # File node
                node["children"][part] = {
                    "name": part,
                    "type": "file",
                    "title": p["title"],
                    "url": p["url"],
                    "tags": p["tags"],
                }
            else:
                if part not in node["children"]:
                    node["children"][part] = {
                        "name": part,
                        "type": "folder",
                        "children": {},
                    }
                node = node["children"][part]

    # Convert dict children to sorted list
    def to_list(node):
        if node["type"] == "folder":
            children = list(node["children"].values())
            children.sort(key=lambda c: (c["type"] == "file", c["name"].lower()))
            for c in children:
                if c["type"] == "folder":
                    to_list(c)
            node["children"] = children
        return node

    return to_list(root)


def build_local_graphs(pages: list[dict], backlinks: dict) -> dict[str, dict]:
    """For each page, compute 1-hop neighborhood (incoming + outgoing)."""
    by_slug = {p["slug"].lower(): p for p in pages}

    graphs = {}
    for page in pages:
        nodes = {page["slug"]: {"id": page["slug"], "title": page["title"], "url": page["url"], "main": True}}
        edges = []

        # Outgoing
        for target_slug in page["outgoing"]:
            target_page = by_slug.get(target_slug)
            if target_page and target_page["slug"] not in nodes:
                nodes[target_page["slug"]] = {
                    "id": target_page["slug"],
                    "title": target_page["title"],
                    "url": target_page["url"],
                    "main": False,
                }
            if target_page:
                edges.append({"from": page["slug"], "to": target_page["slug"]})

        # Incoming
        for source in backlinks.get(page["slug"], []):
            if source["slug"] not in nodes:
                nodes[source["slug"]] = {
                    "id": source["slug"],
                    "title": source["title"],
                    "url": source["url"],
                    "main": False,
                }
            edges.append({"from": source["slug"], "to": page["slug"]})

        graphs[page["slug"]] = {
            "nodes": list(nodes.values()),
            "edges": edges,
        }

    return graphs


def main():
    pages = build_pages()
    backlinks = build_backlinks(pages)

    # Enrich pages with backlink count
    for p in pages:
        p["backlinks_count"] = len(backlinks.get(p["slug"], []))
        p["backlinks"] = backlinks.get(p["slug"], [])

    # Build tree
    tree = build_tree(pages)

    # Write tree JSON
    ASSETS.mkdir(exist_ok=True)
    TREE_JSON.write_text(json.dumps({"tree": tree, "pages": pages}, indent=2), encoding="utf-8")
    print(f"Wrote {TREE_JSON} ({TREE_JSON.stat().st_size} bytes)")

    # Build local graphs
    LOCAL_GRAPHS_DIR.mkdir(exist_ok=True)
    local_graphs = build_local_graphs(pages, backlinks)

    # Write one combined file (small, ~few KB total) — simpler than 18 separate files
    combined_path = ASSETS / "local-graphs.json"
    combined_path.write_text(json.dumps(local_graphs), encoding="utf-8")
    print(f"Wrote {combined_path} ({combined_path.stat().st_size} bytes, {len(local_graphs)} graphs)")

    print(f"\nStats: {len(pages)} pages, {sum(len(p['outgoing']) for p in pages)} outgoing wikilinks, "
          f"{sum(len(p['backlinks']) for p in pages)} backlinks total")


if __name__ == "__main__":
    main()