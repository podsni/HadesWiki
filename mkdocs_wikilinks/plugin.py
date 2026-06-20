"""WikiLinksPlugin — resolves [[wikilinks]] in MkDocs markdown sources.

Features:
- Resolves `[[page-name]]` to standard markdown links
- Supports `[[page-name|display text]]` syntax
- Supports `[[page-name#heading]]` (heading fragment preserved)
- Skips wikilinks inside code spans and code blocks
- Resolves by basename OR full path (case-insensitive)
- Configurable alias map for special names (e.g. [[catalog]] -> catalog.md)
- Builds a backlink index exposed to other plugins via `mkdocs.plugins.wikilinks_backlinks`
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any
from urllib.parse import quote

from mkdocs.config import config_options
from mkdocs.plugins import BasePlugin
from mkdocs.structure.files import Files

# === Regex patterns ===

# Wikilink: [[target]] or [[target|display]] or [[target#heading|display]]
# - target: any chars except ] | #
# - optional #heading
# - optional |display text
WIKILINK_RE = re.compile(
    r"\[\["
    r"([^\]|#]+)"               # 1: target page name
    r"(?:#([^\]|]+))?"          # 2: optional #heading fragment
    r"(?:\|([^\]]+))?"          # 3: optional |display text
    r"\]\]"
)

# Code block fence (``` ... ```) — protect contents
CODE_FENCE_RE = re.compile(r"```[\s\S]*?```")
# Inline code span (` ... `) — protect contents
CODE_SPAN_RE = re.compile(r"`[^`\n]+`")
# Markdown link to a wikilink: [[[xxx]]] (rare double-wrap) — skip
DOUBLE_BRACKET_LINK_RE = re.compile(r"\[\[\[[^\]]+\]\]\]")

# Store backlinks globally so other plugins (and templates) can use them.
# Key: page src_path (relative to docs_dir); Value: list of (source_page_src_path, anchor_text)
BACKLINKS: dict[str, list[tuple[str, str]]] = {}


def slugify(value: str) -> str:
    """Normalize a target name for lookup. Lowercase, strip, collapse."""
    return value.strip().lower().replace(" ", "-")


class WikiLinksPlugin(BasePlugin):
    """Resolves Obsidian-style wikilinks inside MkDocs pages."""

    config_scheme = (
        ("docs_dir", config_options.Dir(exists=True)),
        ("aliases", config_options.Type(dict, default={})),
        ("ignore_missing", config_options.Type(bool, default=False)),
        ("missing_class", config_options.Type(str, default="wikilink-missing")),
    )

    def on_config(self, config: dict[str, Any]) -> dict[str, Any]:
        """Build the slug -> URL map by scanning all .md files."""
        # MkDocs always sets config['docs_dir']; prefer that over our own option
        self.docs_dir = Path(config["docs_dir"]).resolve()
        self.site_url = config.get("site_url", "")
        self.aliases = self.config.get("aliases") or {}
        self.ignore_missing = self.config.get("ignore_missing", False)
        self.missing_class = self.config.get("missing_class", "wikilink-missing")
        self._targets = self._build_target_map()
        return config

    # --- target map ---------------------------------------------------------

    def _build_target_map(self) -> dict[str, dict[str, str]]:
        """Walk docs_dir and build a slug -> {url, title, src_path, type} map.

        Returns a dict keyed by normalized slug, with values being dicts that
        carry enough metadata for rendering and backlinks.
        """
        targets: dict[str, dict[str, str]] = {}

        for md_file in sorted(self.docs_dir.rglob("*.md")):
            rel = md_file.relative_to(self.docs_dir)
            parts = rel.with_suffix("").parts

            # Skip the immutable raw/ subtree — sources are quoted, not linked
            if "raw" in parts:
                continue

            # URL with use_directory_urls semantics:
            #   foo/bar.md       -> foo/bar/
            #   foo/bar/index.md -> foo/bar/  (auto-collapse)
            url_path = str(rel.with_suffix("")).replace(os.sep, "/")
            if url_path.endswith("/index"):
                url_path = url_path[:-5] or ""
            url = "/" + url_path + "/" if url_path else "/"

            # Read title from frontmatter (cheap parse)
            title = self._extract_title(md_file)

            meta = {
                "url": url,
                "title": title,
                "src_path": str(rel),
                "type": self._classify(parts),
            }

            # Register under several keys for flexible resolution:
            # 1. full slug (e.g. "concepts/llm-wiki-pattern")
            full_slug = slugify("/".join(parts))
            targets[full_slug] = meta
            # 2. basename slug (e.g. "llm-wiki-pattern")
            base_slug = slugify(parts[-1])
            if base_slug not in targets:  # first-match wins (depth-first)
                targets[base_slug] = meta
            # 3. alternate aliases from config
            for alias in self.aliases.get(base_slug, []):
                alias_slug = slugify(alias)
                if alias_slug not in targets:
                    targets[alias_slug] = meta

        return targets

    @staticmethod
    def _classify(parts: tuple[str, ...]) -> str:
        """Return a category label from the file path."""
        if not parts:
            return "page"
        return parts[0].rstrip("s") if len(parts) > 1 else "page"

    @staticmethod
    def _extract_title(path: Path) -> str:
        """Pull title from frontmatter, fall back to first H1, else filename."""
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            return path.stem
        if text.startswith("---"):
            end = text.find("\n---", 4)
            if end > 0:
                fm = text[4:end]
                for line in fm.splitlines():
                    if line.startswith("title:"):
                        return line.split(":", 1)[1].strip().strip("'\"")
        # fallback: first H1
        for line in text.splitlines():
            if line.startswith("# "):
                return line[2:].strip()
        return path.stem.replace("-", " ").title()

    # --- page render --------------------------------------------------------

    def on_page_markdown(
        self, markdown: str, page: Any, **kwargs: Any
    ) -> str:
        """Resolve [[wikilinks]] inside a single page's markdown."""
        src = str(page.file.src_path)

        # Stash code spans/blocks so we don't touch them.
        placeholders: dict[str, str] = {}

        def stash(match: re.Match[str]) -> str:
            key = f"\x00WIKILINK_CODE_{len(placeholders)}\x00"
            placeholders[key] = match.group(0)
            return key

        protected = CODE_FENCE_RE.sub(stash, markdown)
        protected = CODE_SPAN_RE.sub(stash, protected)
        protected = DOUBLE_BRACKET_LINK_RE.sub(stash, protected)

        # Track backlinks as we resolve links
        page_backlinks: list[tuple[str, str]] = []

        def resolve(match: re.Match[str]) -> str:
            target_raw = match.group(1)
            heading = (match.group(2) or "").strip()
            display = (match.group(3) or target_raw).strip()
            slug = slugify(target_raw)

            meta = self._targets.get(slug)
            if meta is None:
                if self.ignore_missing:
                    return display
                return (
                    f'<span class="{self.missing_class}" '
                    f'title="No page found for: {target_raw}">{display}</span>'
                )

            # Compute relative URL from current page to target
            target_url = meta["url"]
            href = self._relative_url(page, target_url)
            if heading:
                href += "#" + quote(heading.replace(" ", "-"), safe="-_")

            # Record backlink (only when target is in the same wiki, not raw)
            page_backlinks.append((target_url, meta["title"] or target_raw))

            return f"[{display}]({href})"

        resolved = WIKILINK_RE.sub(resolve, protected)

        # Restore stashed code blocks/spans
        for key, original in placeholders.items():
            resolved = resolved.replace(key, original)

        # Stash backlink list for on_page_context
        BACKLINKS[src] = page_backlinks
        return resolved

    def _relative_url(self, page: Any, target_url: str) -> str:
        """Compute a relative URL from the current page to the target.

        Both URLs are root-absolute and end with '/'. We strip leading '/',
        compute relative path from current page's directory to the target's
        path, then re-append '/'.
        """
        page_url = page.file.url or "/"
        # Normalize: strip leading and trailing slashes for path math
        page_path = page_url.strip("/")
        target_path = target_url.strip("/")

        if not page_path:
            page_dir = "."
        else:
            page_dir = os.path.dirname(page_path) or "."

        if not target_path:
            rel = "."
        else:
            rel = os.path.relpath(target_path, page_dir)
        if rel == ".":
            return "./"
        if not rel.startswith(".") and not rel.startswith("/"):
            rel = "./" + rel
        return rel + "/"

    # --- backlinks ----------------------------------------------------------

    def on_page_context(
        self, context: dict[str, Any], page: Any, **kwargs: Any
    ) -> dict[str, Any]:
        """Inject backlinks into the page template context."""
        src = str(page.file.src_path)
        here_url = page.file.url or "/"
        here_title = page.title or src
        incoming: list[dict[str, str]] = []
        for source_src, links in BACKLINKS.items():
            if source_src == src:
                continue
            for url, title in links:
                if url == here_url:
                    incoming.append({"src": source_src, "title": title})
                    break
        context["wikilinks_backlinks"] = incoming
        return context

    def on_page_content(
        self, html: str, page: Any, **kwargs: Any
    ) -> str:
        """Append a backlinks panel to the bottom of every page that has incoming links."""
        src = str(page.file.src_path)
        # Skip backlinks on the catalog, raw sources, and special pages
        skip = ("catalog.md", "index.md", "graph.md", "tags.md",
                "log.md", "GUIDE.md", "AGENT.md", "schema.md")
        if any(src == s or src.endswith("/" + s) for s in skip):
            return html

        here_url = "/" + (page.file.url or "/").lstrip("/")
        incoming: list[tuple[str, str, str, str]] = []  # (target_title, source_src, source_url, source_title)
        for source_src, links in BACKLINKS.items():
            if source_src == src:
                continue
            for url, title in links:
                if url == here_url:
                    source_url = self._src_path_to_url(source_src)
                    # Look up source title from target map
                    src_slug_full = slugify(source_src.replace(".md", ""))
                    src_meta = self._targets.get(src_slug_full) or self._targets.get(
                        slugify(source_src.split("/")[-1].replace(".md", ""))
                    )
                    source_title = (src_meta or {}).get("title", source_src)
                    incoming.append((title, source_src, source_url, source_title))
                    break

        if not incoming:
            return html

        # Deduplicate by source
        seen = set()
        unique = []
        for tgt_title, source_src, source_url, source_title in incoming:
            if source_src not in seen:
                seen.add(source_src)
                unique.append((tgt_title, source_src, source_url, source_title))

        items = "\n".join(
            f'<li><a href="{self._relative_url(page, source_url)}">{source_title}</a></li>'
            for _, _, source_url, source_title in unique
        )
        panel = (
            f'\n<aside class="wikilinks-backlinks">\n'
            f'  <h2>Linked from</h2>\n'
            f'  <p class="backlinks-meta">Pages that link to this one:</p>\n'
            f'  <ul>\n{items}\n  </ul>\n'
            f'</aside>\n'
        )
        return html + panel

    def _src_path_to_url(self, src_path: str) -> str:
        """Convert a page src_path (e.g. 'concepts/llm-wiki-pattern.md')
        to its site URL (e.g. '/concepts/llm-wiki-pattern/')."""
        url_path = src_path.replace(".md", "")
        if url_path.endswith("/index"):
            url_path = url_path[:-5]
        url_path = url_path.replace(os.sep, "/")
        return "/" + url_path + "/" if url_path else "/"