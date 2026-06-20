#!/usr/bin/env python3
"""
Generate three artifacts for the Obsidian-like UI:

  1. docs/assets/wiki-tree.json
     — full file tree (folders + files with metadata: tags, title, url, icon, show_in_tree)
     — pages list with backlinks, outgoing links, page-type classification

  2. docs/assets/local-graphs.json
     — per-page local graph: 1-hop neighborhood (incoming + outgoing) for hover preview
       and JS-rendered local graph view

  3. (replaces docs/graph.md + tags.md as JSON — JS renders them dynamically)

This runs offline (no MkDocs), scans `docs/` recursively, parses frontmatter,
and writes JSON files that `extra.js` loads at runtime.

PAGE CLASSIFICATION (Obsidian-style):
  - Wiki content pages: show_in_tree=true, displayed in main NOTES section
  - Meta pages (catalog, tags, graph, log, schema, AGENT, GUIDE, README, home):
      show_in_tree=false, displayed in collapsible META section
  - Raw sources (raw/ folder): hidden entirely from sidebar
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from urllib.parse import quote

REPO = Path(__file__).resolve().parent.parent
DOCS = REPO / "docs"
ASSETS = DOCS / "assets"
TREE_JSON = ASSETS / "wiki-tree.json"
LOCAL_GRAPHS_DIR = ASSETS / "local-graphs"

# Meta page filenames (singletons at root) — hidden from main tree, shown in META section
META_FILENAMES = {
    "home", "index",        # root home page
    "catalog",              # full page listing
    "tags",                 # tag index
    "graph",                # graph view
    "log",                  # activity log
    "schema",               # conventions
    "AGENT",                # LLM-facing docs
    "GUIDE",                # install/usage docs
    "README",               # repo readme (if any)
}

# Subfolder paths that are entirely meta/hidden
HIDDEN_FOLDERS = {"raw"}

# Icons by path prefix (Obsidian-style emoji icons)
PATH_ICONS = [
    ("concepts/", "💡"),
    ("comparisons/", "⚖️"),
    ("queries/", "🔍"),
    ("entities/", "👤"),
    ("raw/", "📦"),
]
ICON_DEFAULT = "📄"
META_ICONS = {
    "home": "🏠", "index": "🏠",
    "catalog": "📚",
    "tags": "🏷️",
    "graph": "🕸️",
    "log": "📜",
    "schema": "📋",
    "AGENT": "🤖",
    "GUIDE": "📖",
    "README": "📘",
}


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
        if key in fm:
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
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = re.sub(r"`[^`\n]+`", "", text)
    links = set()
    for m in re.finditer(r"\[\[([^\]|#]+)(?:[#\|][^\]]*)?\]\]", text):
        target = m.group(1).strip()
        target = target.replace("\\", "/").split("/")[-1]
        target = re.sub(r"\.md$", "", target)
        links.add(target.lower())
    return links


def classify_page(rel_path: Path) -> tuple[str, bool, str]:
    """
    Returns (category, show_in_tree, icon) for a page.

    Categories:
      - "content": wiki content, shown in main NOTES section
      - "meta":    top-level meta page, hidden from main, shown in collapsible META section
      - "hidden":  hidden entirely from sidebar (raw sources, etc.)
    """
    parts = rel_path.parts

    # Hidden folders (raw/) — never show
    if parts[0] in HIDDEN_FOLDERS:
        return ("hidden", False, PATH_ICONS[-1][1])

    stem = rel_path.stem
    if stem in META_FILENAMES:
        # Top-level meta page
        icon = META_ICONS.get(stem, "📄")
        return ("meta", False, icon)

    # Wiki content page — pick icon by path prefix
    rel = str(rel_path).replace("\\", "/")
    icon = ICON_DEFAULT
    for prefix, ico in PATH_ICONS:
        if rel.startswith(prefix):
            icon = ico
            break

    return ("content", True, icon)


def build_pages() -> list[dict]:
    """Walk docs/, parse each .md, extract metadata + classify."""
    pages = []
    for md_path in sorted(DOCS.rglob("*.md")):
        rel = md_path.relative_to(DOCS)
        if rel.parts[0] in ("assets",):
            continue
        text = md_path.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        title = fm.get("title") or title_from_filename(md_path)
        tags_raw = fm.get("tags", [])
        if isinstance(tags_raw, list):
            tags = [str(t).strip() for t in tags_raw if str(t).strip()]
        else:
            tags = [t.strip() for t in str(tags_raw).split(",") if t.strip()]
        url_rel = str(rel.with_suffix("")).replace("\\", "/")
        if url_rel == "index":
            url = "/"
        else:
            url = "/" + url_rel + "/"

        category, show_in_tree, icon = classify_page(rel)
        outgoing = sorted(extract_wikilinks(text))

        pages.append({
            "path": str(rel),
            "slug": url_rel,
            "title": title,
            "url": url,
            "tags": tags,
            "outgoing": outgoing,
            "folder": str(rel.parent) if rel.parent != Path(".") else "",
            "category": category,
            "show_in_tree": show_in_tree,
            "icon": icon,
        })
    return pages


def build_backlinks(pages: list[dict]) -> dict[str, list[dict]]:
    by_slug = {}
    for p in pages:
        by_slug[p["slug"].lower()] = p
        base = p["slug"].lower().split("/")[-1]
        by_slug.setdefault(base, p)

    backlinks = defaultdict(list)
    for source in pages:
        for target_slug in source["outgoing"]:
            target_page = by_slug.get(target_slug)
            if target_page:
                backlinks[target_page["slug"]].append({
                    "slug": source["slug"],
                    "title": source["title"],
                    "url": source["url"],
                })
    return dict(backlinks)


def build_tree(pages: list[dict]) -> dict:
    """
    Build nested folder/file tree containing ONLY pages where show_in_tree=True.
    Excludes hidden/meta pages entirely (they're listed separately in pages[]).
    """
    root = {"name": "HadesWiki", "type": "folder", "children": {}}

    for p in pages:
        if not p["show_in_tree"]:
            continue
        parts = p["path"].split("/")
        parts[-1] = parts[-1][:-3]
        node = root
        for i, part in enumerate(parts):
            is_last = i == len(parts) - 1
            if is_last:
                node["children"][part] = {
                    "name": part,
                    "type": "file",
                    "title": p["title"],
                    "url": p["url"],
                    "tags": p["tags"],
                    "icon": p["icon"],
                    "slug": p["slug"],
                    "category": p["category"],
                }
            else:
                if part not in node["children"]:
                    node["children"][part] = {
                        "name": part,
                        "type": "folder",
                        "children": {},
                    }
                node = node["children"][part]

    def to_list_with_counts(node):
        if node["type"] == "folder":
            # First convert children dict → list, recurse into sub-folders
            children = list(node["children"].values())
            children.sort(key=lambda c: (c["type"] == "file", c["name"].lower()))
            for c in children:
                if c["type"] == "folder":
                    to_list_with_counts(c)
            node["children"] = children
            # Now compute file count (recursive) — children is a list of dicts
            def count_files(n):
                if n["type"] == "file":
                    return 1
                return sum(count_files(c) for c in n["children"])
            node["file_count"] = count_files(node)
        return node

    return to_list_with_counts(root)


def build_meta_section(pages: list[dict]) -> list[dict]:
    """Build flat list of meta pages for collapsible META section."""
    meta_pages = []
    for p in pages:
        if p["category"] == "meta":
            meta_pages.append({
                "title": p["title"],
                "url": p["url"],
                "icon": p["icon"],
                "slug": p["slug"],
                "tags": p["tags"],
            })
    # Sort alphabetically by title
    meta_pages.sort(key=lambda p: p["title"].lower())
    return meta_pages


def build_local_graphs(pages: list[dict], backlinks: dict) -> dict[str, dict]:
    by_slug = {p["slug"].lower(): p for p in pages}

    graphs = {}
    for page in pages:
        nodes = {page["slug"]: {"id": page["slug"], "title": page["title"], "url": page["url"], "main": True, "icon": page["icon"]}}
        edges = []

        for target_slug in page["outgoing"]:
            target_page = by_slug.get(target_slug)
            if target_page:
                if target_page["slug"] not in nodes:
                    nodes[target_page["slug"]] = {
                        "id": target_page["slug"],
                        "title": target_page["title"],
                        "url": target_page["url"],
                        "main": False,
                        "icon": target_page["icon"],
                    }
                edges.append({"from": page["slug"], "to": target_page["slug"]})

        for source in backlinks.get(page["slug"], []):
            if source["slug"] not in nodes:
                source_page = by_slug.get(source["slug"])
                nodes[source["slug"]] = {
                    "id": source["slug"],
                    "title": source["title"],
                    "url": source["url"],
                    "main": False,
                    "icon": source_page["icon"] if source_page else "📄",
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

    # Build filtered tree (only show_in_tree pages)
    tree = build_tree(pages)

    # Build meta section
    meta_section = build_meta_section(pages)

    # Stats
    content_count = sum(1 for p in pages if p["category"] == "content")
    meta_count = sum(1 for p in pages if p["category"] == "meta")
    hidden_count = sum(1 for p in pages if p["category"] == "hidden")

    # Write tree JSON
    ASSETS.mkdir(exist_ok=True)
    tree_data = {
        "tree": tree,
        "meta_section": meta_section,
        "pages": pages,
        "stats": {
            "total": len(pages),
            "content": content_count,
            "meta": meta_count,
            "hidden": hidden_count,
            "shown_in_tree": sum(1 for p in pages if p["show_in_tree"]),
        }
    }
    TREE_JSON.write_text(json.dumps(tree_data, indent=2), encoding="utf-8")
    print(f"Wrote {TREE_JSON} ({TREE_JSON.stat().st_size} bytes)")
    print(f"  {content_count} content + {meta_count} meta + {hidden_count} hidden = {len(pages)} total")
    print(f"  Tree shows {tree_data['stats']['shown_in_tree']} pages; meta section has {len(meta_section)} pages")

    # Build local graphs (all pages including hidden — used for graph views)
    LOCAL_GRAPHS_DIR.mkdir(exist_ok=True)
    local_graphs = build_local_graphs(pages, backlinks)

    combined_path = ASSETS / "local-graphs.json"
    combined_path.write_text(json.dumps(local_graphs), encoding="utf-8")
    print(f"Wrote {combined_path} ({combined_path.stat().st_size} bytes, {len(local_graphs)} graphs)")

    print(f"\nTotal: {len(pages)} pages, {sum(len(p['outgoing']) for p in pages)} outgoing wikilinks, "
          f"{sum(len(p['backlinks']) for p in pages)} backlinks total")


if __name__ == "__main__":
    main()