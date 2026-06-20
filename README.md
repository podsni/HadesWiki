# HadesWiki

A personal knowledge base built with the **LLM Wiki pattern** — a Karpathy idea
where an LLM agent incrementally maintains a persistent, interlinked wiki of
markdown files instead of re-deriving answers from raw documents at every query.

> "The wiki is a persistent, compounding artifact. The cross-references are
> already there. The contradictions have already been flagged. The synthesis
> already reflects everything you've read."
> — Andrej Karpathy, [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)

This repository is both an instance of the pattern and a meta-wiki documenting it.

## What This Wiki Is About

The **domain** is knowledge-base methodology itself — Karpathy's LLM Wiki pattern,
the operational practices that make LLM-maintained wikis work, and the tooling
that supports them. The single source ingested so far is Karpathy's idea file;
the wiki expands as new sources are added.

## Layout

```
HadesWiki/
├── README.md                          # this file
├── AGENT.md                           # operational playbook for LLM agents
├── schema.md                          # conventions, frontmatter spec, tag taxonomy
├── index.md                           # content catalog of every wiki page
├── log.md                             # chronological action log
│
├── raw/                               # IMMUTABLE source layer
│   ├── articles/                      # web articles, gists, blog posts
│   ├── papers/                        # academic PDFs
│   ├── transcripts/                   # talks, interviews, podcasts
│   └── assets/                        # images, data files
│
├── entities/                          # one page per notable entity (person, tool, system)
├── concepts/                          # one page per concept or topic
├── comparisons/                       # side-by-side analyses
└── queries/                           # filed query answers worth keeping
```

The `raw/` layer is the source of truth — LLM agents read but never modify it.
Everything else is LLM-generated and LLM-maintained.

## Quick Start

### Browse with Obsidian (recommended)

1. Install [Obsidian](https://obsidian.md/).
2. **Open as vault** → point at this directory.
3. Open **Graph View** — you'll see `llm-wiki-pattern` at the centre, with the
   other pages radiating out via `[[wikilinks]]`.
4. Open `index.md` for the catalog, or `log.md` for the activity timeline.

### Browse with any text editor

Everything is plain markdown. No database, no build step. `index.md` is the
table of contents; everything cross-references via `[[wikilinks]]`.

### Use with an LLM agent

Point Claude Code, OpenAI Codex, or any LLM CLI tool at this directory. The
agent will auto-load `AGENT.md` and follow the orientation → ingest/query/lint
workflow documented there.

## Current State

- **Pages**: 10 wiki pages (1 entity, 6 concepts, 1 comparison, 1 query, 1 source-summary)
- **Sources ingested**: 1 (Karpathy's LLM Wiki gist, sha256-verified)
- **Lint status**: ✓ all clean (0 broken links, 0 orphans, 0 frontmatter issues)

See `index.md` for the full catalog and `log.md` for the activity log.

## How to Add a Source

1. Save the source to the appropriate `raw/` subdirectory (e.g. `raw/articles/`).
2. Add frontmatter with the source URL, ingestion date, and sha256 of the body.
3. Tell your LLM agent: *"Process `raw/articles/<filename>.md`"*.
4. The agent will orient itself from `AGENT.md`, write or update wiki pages,
   update `index.md`, and append to `log.md`.

Or do it manually following the schema in `schema.md` and the workflow in `AGENT.md`.

## Conventions in 30 Seconds

- **Filenames**: lowercase, hyphens, no spaces — `llm-wiki-pattern.md`, not `LLM Wiki Pattern.md`
- **Frontmatter**: YAML at the top of every page (title, dates, type, tags, sources)
- **Cross-references**: `[[page-name]]` (Obsidian-native)
- **Tags**: must come from the taxonomy in `schema.md` — add new tags there first
- **Provenance**: paragraphs synthesizing from a specific source end with
  `^[raw/articles/source-file.md]`
- **`raw/` is immutable**: corrections go into wiki pages, never into `raw/`
- **Read `schema.md`** before doing anything non-trivial

## Why This Works

Humans abandon wikis because the maintenance burden grows faster than the value.
LLMs don't get bored, don't forget to update a cross-reference, and can touch
15 files in one pass. The cost of maintenance stays near zero, so the wiki
actually stays maintained.

The human curates sources and asks questions; the LLM does the bookkeeping.
The wiki compounds: every source adds to it, every query can be filed back,
every lint pass catches drift.

## Related

- [Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
  — the original pattern document
- [qmd](https://github.com/tobi/qmd) — local BM25+vector search for markdown wikis
- [Obsidian](https://obsidian.md/) — the typical IDE for browsing the wiki

## License

The wiki content is licensed under MIT. Raw sources retain their original
licenses — see each `raw/` file for attribution.