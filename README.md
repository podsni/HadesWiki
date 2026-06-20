# HadesWiki

> **🌐 Live site: https://podsni.github.io/HadesWiki/**
>
> The full wiki is published via GitHub Pages with MkDocs Material. This README
> is a slim landing page; all content lives in `docs/` and is rendered at the
> URL above.

A personal knowledge base built with [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — a persistent, LLM-maintained, compounding wiki of interlinked markdown files instead of re-deriving answers from raw documents at every query.

## What is this?

| Layer | Location | Owner |
|---|---|---|
| **Live site** | https://podsni.github.io/HadesWiki/ | MkDocs Material build |
| **Wiki content** | [`docs/`](./docs/) | LLM agent (auto-maintained) |
| **Build config** | [`mkdocs.yml`](./mkdocs.yml) | Co-evolved with the wiki |
| **Raw sources** | [`docs/raw/`](./docs/raw/) | Immutable |
| **CI/CD** | [`.github/workflows/pages.yml`](./.github/workflows/pages.yml) | Auto-deploys on push to `main` |

## Quick links

- **[🌐 Browse the site](https://podsni.github.io/HadesWiki/)** — Material theme, full-text search, wikilink navigation
- **[📖 Wiki Catalog](./docs/catalog.md)** — full catalog of pages
- **[📦 Install & Usage Guide](./docs/GUIDE.md)** — clone, Obsidian setup, LLM CLI agent
- **[🤖 Agent Playbook](./docs/AGENT.md)** — operational playbook for LLM agents maintaining the wiki
- **[📋 Schema](./docs/schema.md)** — conventions, frontmatter spec, tag taxonomy
- **[📜 Activity Log](./docs/log.md)** — chronological record of all wiki actions

## Local development

```bash
# Clone
git clone https://github.com/podsni/HadesWiki.git
cd HadesWiki

# Install MkDocs Material + plugins
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Preview locally (auto-reload on edit)
mkdocs serve
# → open http://127.0.0.1:8000/HadesWiki/

# Build static site
mkdocs build
# → output in ./site/
```

## Open in Obsidian

```bash
git clone https://github.com/podsni/HadesWiki.git ~/HadesWiki
# Obsidian → Open folder as vault → ~/HadesWiki
# Graph View will show llm-wiki-pattern at the center
```

## The pattern in one quote

> "The wiki is a persistent, compounding artifact. The cross-references are already there. The contradictions have already been flagged. The synthesis already reflects everything you've read."
> — Andrej Karpathy

## License

Wiki content: [MIT](./LICENSE). Raw sources retain their original licenses — see each `docs/raw/` file for attribution.

## Related

- [Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — the canonical pattern document
- [qmd](https://github.com/tobi/qmd) — local BM25+vector search for markdown wikis
- [Obsidian](https://obsidian.md/) — IDE for browsing the wiki
- [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) — what powers the GitHub Pages site