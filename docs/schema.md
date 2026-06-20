---
title: HadesWiki Schema
created: 2026-06-12
updated: 2026-06-12
type: schema
tags: [schema, meta]
sources: []
---

# HadesWiki Schema

## Domain

Knowledge-base methodology — Karpathy's LLM Wiki pattern, the operational practices
that make LLM-maintained wikis work, and the tooling that supports them. Sources are
articles, papers, gists, and talks about KB design, RAG, agent-driven note systems,
Obsidian workflows, and adjacent topics (Memex, hypertext, Zettelkasten).

HadesWiki is itself an instance of the pattern it documents: every page below is
LLM-maintained, cross-linked, and derived from a raw source. The wiki is the
ground truth for **how to operate**; the raw files are the ground truth for **what
was said**.

## Conventions

- File names: lowercase, hyphens, no spaces (e.g. `llm-wiki-pattern.md`)
- Every wiki page starts with YAML frontmatter (see Frontmatter block below)
- Use double-bracket links (`[[page-name]]`) to cross-reference between pages — minimum
  2 outbound links per page, 1 inbound target ideally. These render as
  **clickable links** on the published site via the custom wikilinks plugin.
- When updating a page, always bump the `updated` date
- Every new page must be added to `catalog.md` under the correct section, alphabetically
- Every action must be appended to `log.md` with a `## [YYYY-MM-DD] action | subject` prefix
- **Provenance markers:** On pages that synthesize 3+ sources, append
  `^[raw/articles/source-file.md]` at the end of paragraphs whose claims come from
  a specific source. Single-source pages can rely on `sources:` frontmatter alone.
- **Claims over confidence:** Mark `confidence: low` for opinion-heavy, fast-moving,
  or single-source claims. Mark `contested: true` and add `contradictions: [slug]`
  when a page disagrees with another page.
- **Never edit `raw/`** — sources are immutable. Corrections go into wiki pages.
- **Always orient first** at session start: read SCHEMA.md, catalog.md, and the last
  30 lines of log.md before doing anything else.

## Frontmatter

```yaml
---
title: Page Title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | query | summary | schema | meta
tags: [from taxonomy below]
sources: [raw/articles/source-name.md]
# Optional quality signals:
confidence: high | medium | low          # how well-supported the claims are
contested: true                            # page has unresolved contradictions
contradictions: [other-page-slug]          # pages this one conflicts with
---
```

### raw/ Frontmatter

Raw sources ALSO get a small frontmatter block so re-ingests can detect drift:

```yaml
---
source_url: https://example.com/article
ingested: YYYY-MM-DD
sha256: <hex digest of the body below the frontmatter>
---
```

The `sha256:` lets a future re-ingest of the same URL skip processing when content
is unchanged, and flag drift when it has changed. Compute over the body only
(everything after the closing `---`), not the frontmatter itself.

## Tag Taxonomy

Top-level tags for the knowledge-base methodology domain. Add new tags here
BEFORE using them.

- **Patterns**: pattern, methodology, workflow
- **Architecture**: architecture, data-model, schema
- **Operations**: operations, ingest, query, lint, maintenance, curation, search
- **Sources**: source, article, paper, talk, gist
- **Comparison**: comparison, vs, trade-off, synthesis
- **Tools**: tool, cli, editor, obsidian, qmd, mcp
- **Concepts**: concept, rag, embedding, vector-search, bm25, knowledge-base
- **History**: history, memex, hypertext, zettelkasten
- **Entities**: person, source-author, karpathy
- **Meta**: meta, opinion, prediction, critique, open-question

Rule: every tag on a page must appear in this taxonomy. If a new tag is needed,
add it here first, then use it.

## Page Thresholds

- **Create a page** when an entity/concept appears in 2+ sources OR is central to one source
- **Add to existing page** when a source mentions something already covered
- **DON'T create a page** for passing mentions, minor details, or things outside the domain
- **Split a page** when it exceeds ~200 lines — break into sub-topics with cross-links
- **Archive a page** when its content is fully superseded — move to `_archive/`,
  remove from index, update inbound links

## Entity Pages

One page per notable entity (person, tool, organization, system). Include:

- Overview / what it is
- Key facts and dates
- Relationships to other entities (double-bracket links)
- Source references

## Concept Pages

One page per concept or topic. Include:

- Definition / explanation
- Current state of knowledge
- Open questions or debates
- Related concepts (double-bracket links)

## Comparison Pages

Side-by-side analyses. Include:

- What is being compared and why
- Dimensions of comparison (table format preferred)
- Verdict or synthesis
- Sources

## Update Policy

When new information conflicts with existing content:

1. Check the dates — newer sources generally supersede older ones
2. If genuinely contradictory, note both positions with dates and sources
3. Mark the contradiction in frontmatter: `contradictions: [page-name]`
4. Flag for user review in the lint report

## Orientation Workflow (start of every session)

```bash
WIKI=/root/HadesWiki
read_file "$WIKI/SCHEMA.md"            # this file
read_file "$WIKI/catalog.md"             # what's here
read_file "$WIKI/log.md" offset=<last 30 lines>   # what's been done
```

Only after orientation: ingest, query, or lint. Skipping this step causes
duplicate pages, missed cross-references, and contradicting the schema.

## Pitfalls

- **Never modify files in `raw/`** — sources are immutable.
- **Always orient first** — read SCHEMA + index + recent log before any operation.
- **Always update catalog.md and log.md** — skipping this degrades the wiki.
- **Don't create pages for passing mentions** — follow Page Thresholds.
- **Don't create pages without cross-references** — isolated pages are invisible.
  Every page must link to at least 2 other pages.
- **Frontmatter is required** — it enables search, filtering, staleness detection.
- **Tags must come from the taxonomy** — freeform tags decay into noise.
- **Keep pages scannable** — readable in 30 seconds. Split pages over 200 lines.
- **Ask before mass-updating** — if an ingest would touch 10+ existing pages, confirm.

## Interactive features on the published site

The GitHub Pages site (`https://podsni.github.io/HadesWiki/`) has several
interactive features powered by the custom `mkdocs_wikilinks/` plugin:

| Feature | What it does |
|---|---|
| **Clickable `[[wikilinks]]`** | `[[page-name]]` resolves to a clickable link. Supports `[[page\|display]]` and `[[page#heading]]`. Skips code spans/blocks. |
| **Backlinks panel** | Every page shows an inline panel listing other pages that link to it (auto-generated). |
| **Graph view** | A Mermaid-rendered flowchart of all wiki pages and their connections at `/graph/`. |
| **Tag index** | All pages browsable by tag at `/tags/`. |
| **Full-text search** | Press `/` to focus the search box. Supports fuzzy + exact match. |
| **Instant navigation** | SPA-style page transitions — no full reload. |
| **Dark/light mode** | Toggle via the icon (top right). |
| **Code features** | Syntax highlighting, line numbers, copy buttons, inline annotations. |
| **Keyboard shortcuts** | `/` to search, `Esc` to blur, click anchors for smooth scroll. |

The plugin source lives at `mkdocs_wikilinks/` (local Python package, install
via `pip install -e .`). It is a single-file plugin (~300 LOC) with zero
runtime dependencies beyond MkDocs itself.
- **Rotate the log** — when log.md exceeds 500 entries, rename `log-YYYY.md`,
  start fresh.
- **Handle contradictions explicitly** — note both claims with dates, mark in
  frontmatter, flag for review.
- **Verify sha256 on re-ingest** — same hash means skip; different hash means drift.