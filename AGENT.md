# AGENT.md

Operational playbook for any LLM agent working on this wiki. Codex, Claude Code,
OpenCode, Hermes — same workflow.

## What This Wiki Is

A persistent, LLM-maintained knowledge base built with Karpathy's LLM Wiki
pattern. The agent (you) own the `entities/`, `concepts/`, `comparisons/`, and
`queries/` directories, plus `index.md`, `log.md`, and `schema.md`. The user owns
sourcing, exploration, and the questions that drive growth. `raw/` is read-only.

## Start of Every Session — Orient First

Before doing anything, read in this order:

1. **`AGENT.md`** (this file) — your workflow
2. **`schema.md`** — conventions, frontmatter spec, tag taxonomy
3. **`index.md`** — what pages exist and their one-line summaries
4. **`log.md`** — last 30 entries via `read_file` with offset/limit, or:
   ```bash
   grep "^## \[" /root/HadesWiki/log.md | tail -10
   ```

Skipping orientation causes duplicate pages, missed cross-references, and
violations of the schema. It takes 30 seconds and prevents real damage.

## Directory Map

| Path | Owner | Mutable | Purpose |
|---|---|---|---|
| `raw/articles/`, `raw/papers/`, `raw/transcripts/`, `raw/assets/` | Human | ❌ NEVER | Source documents. Append only with frontmatter (source_url, ingested, sha256). |
| `entities/` | Agent | ✅ | One page per notable entity |
| `concepts/` | Agent | ✅ | One page per topic/concept |
| `comparisons/` | Agent | ✅ | Side-by-side analyses |
| `queries/` | Agent | ✅ | Filed query answers worth keeping |
| `index.md` | Agent | ✅ | Content catalog — update on every ingest |
| `log.md` | Agent | ✅ | Append-only action log |
| `schema.md` | Co-evolved | ✅ | Conventions, taxonomy, thresholds |
| `AGENT.md` | Co-evolved | ✅ | This file |

## Three Operations

### 1. Ingest

When the user adds a source to `raw/`:

```bash
# 1. Verify source
sha256sum raw/articles/<file>.md
# Compare to the sha256 in frontmatter

# 2. Read source
read_file raw/articles/<file>.md
```

Then:
1. Discuss takeaways with the user — surface the most interesting claims.
2. Decide which **new pages** to create (only if the entity/concept is central
   to the source OR appears in 2+ sources — see Page Thresholds in `schema.md`).
3. Decide which **existing pages** to update (cross-reference, add new claims,
   bump `updated` date).
4. For each new/updated page:
   - Frontmatter: title, created, updated, type, tags, sources, optional confidence
   - Tags must come from the taxonomy in `schema.md`
   - ≥2 outbound `[[wikilinks]]` (Obsidian convention)
   - Provenance: paragraphs synthesizing from a specific source end with
     `^[raw/articles/source-file.md]`
   - If the claim is opinion-heavy or fast-moving, set `confidence: low`
   - If contradictory, mark `contested: true` and `contradictions: [slug]`
5. Update `index.md` — add new pages alphabetically under the correct section;
   bump the "Total pages" and "Last updated" header.
6. Append to `log.md`:
   ```
   ## [YYYY-MM-DD] ingest | Source Title
   - Source: <url>
   - Saved to: raw/<path>
   - Pages created: ...
   - Pages updated: ...
   - Total pages: N
   ```
7. Report to the user: list every file created and updated.

A single source may touch 10–15 pages. This is normal — it's the compounding effect.

### 2. Query

When the user asks a question:

```bash
# 1. Orient (always)
grep -l "<keyword>" entities/ concepts/ comparisons/ queries/ schema.md index.md log.md 2>/dev/null
```

Or use `search_files` for content search across the wiki.

Then:
1. Read `index.md` to identify candidate pages.
2. For wikis with 100+ pages, also `search_files` for keywords across `.md` files.
3. Read relevant pages with `read_file`.
4. Synthesize. Cite wiki pages by name: "Based on `llm-wiki-pattern` and
   `rag-vs-llm-wiki`..." Avoid hallucinating — if a claim isn't on a wiki page,
   say so and offer to fetch a source.
5. **File valuable answers back.** If the answer is a substantial comparison,
   a deep dive, or a novel synthesis — create a page in `queries/` or
   `comparisons/`. Trivial lookups don't get filed.
6. Update `log.md`:
   ```
   ## [YYYY-MM-DD] query | <topic>
   - Filed: queries/<filename>.md (or "not filed — trivial lookup")
   ```

### 3. Lint

Run a health check on the wiki. Open `/root/HadesWiki` in a Python REPL or
shell session and run a script that checks:

1. **sha256 of every `raw/` file** matches the frontmatter value.
2. **Broken wikilinks** — `[[xxx]]` where `xxx` doesn't exist (after stripping
   code spans). Case-insensitive match.
3. **Orphan pages** — zero inbound `[[wikilinks]]`.
4. **Frontmatter completeness** — required fields present (`title`, `created`,
   `updated`, `type`, `tags`, `sources`).
5. **Tag taxonomy** — every tag in use appears in `schema.md`.
6. **Page size** — flag any page > 200 lines for splitting.
7. **Outbound link minimum** — every wiki page has ≥2 outbound `[[wikilinks]]`
   (except `index.md`, `log.md`, `schema.md`).
8. **Index completeness** — every wiki page appears in `index.md`.
9. **Source drift** — recompute sha256 on each `raw/` file; flag mismatches.
10. **Log rotation** — if `log.md` exceeds 500 entries, rotate:
    ```
    mv log.md log-YYYY.md
    ```

Group findings by severity:
- **Critical**: broken links, source drift, frontmatter missing
- **Warning**: orphan pages, contradictions unresolved, pages > 200 lines
- **Notice**: tags outside taxonomy, low outbound counts

Append to `log.md`:
```
## [YYYY-MM-DD] lint | N issues (X critical, Y warning, Z notice)
- Findings: ...
- Fixes applied: ...
```

## Pitfalls

| Pitfall | Consequence | Avoidance |
|---|---|---|
| Editing `raw/` | Breaks the source-of-truth invariant | Don't. Period. |
| Skipping orientation | Duplicate pages, missed cross-references | Always read AGENT + schema + index + log tail first |
| Forgetting `index.md` | Wiki becomes unnavigable | Update on every ingest/query |
| Forgetting `log.md` | Loss of timeline, can't debug drift | Append on every action |
| Creating pages for passing mentions | Wiki bloat | Follow Page Thresholds |
| Pages without `[[wikilinks]]` | Invisible islands | Every page must link ≥2 others |
| Tags outside taxonomy | Tag rot | Add new tags to `schema.md` first |
| Pages over 200 lines | Unreadable | Split into sub-topics |
| Long lists without sources | Credibility loss | Cite raw files via `^[raw/...]` markers |
| Mass-updating without confirmation | Surprises the user | If a single ingest touches 10+ pages, confirm scope first |
| Adding information without sources | Hallucination | Every claim must trace to a raw source or be flagged as opinion |
| Letting contradictions fester | Wiki becomes unreliable | Note both claims, mark `contested`, flag in lint |

## Frontmatter Spec

Every wiki page (except `index.md`, `log.md`) starts with:

```yaml
---
title: Page Title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | query | summary | schema | meta
tags: [from taxonomy in schema.md]
sources: [raw/articles/source-name.md]
# Optional:
confidence: high | medium | low
contested: true
contradictions: [other-page-slug]
---
```

Raw sources use a different frontmatter:

```yaml
---
source_url: https://example.com/article
ingested: YYYY-MM-DD
sha256: <hex digest of body below the frontmatter>
---
```

Compute sha256 over the **body** (everything after the closing `---`), not
over the frontmatter itself.

## Wikilink Syntax

`[[page-name]]` or `[[page-name|displayed text]]`. Case-insensitive when
matching to filenames. Inside code spans (`` `[[example]]` ``) the literal
syntax doesn't render as a link — handy for examples in `schema.md`.

## Tag Taxonomy

All tags must be registered in `schema.md` before use. If you need a new tag,
add it to the taxonomy section first, then use it on pages.

## When Stuck

- Read `schema.md` again. Conventions are documented there.
- Read the relevant concept page — most operational questions are already
  answered in `concepts/operations.md`.
- Run a lint pass — surfaces structural problems.
- Ask the user. They are the curator and the source of direction.

## Performance Notes

- For wikis < 100 pages, `index.md` is sufficient for navigation.
- For wikis 100–1000 pages, add `qmd` or similar local search.
- For wikis > 1000 pages, consider splitting by sub-domain into multiple vaults.
- A single Python lint script (under ~50 lines) covers all 7 lint checks.

## Related

- `schema.md` — full conventions and tag taxonomy
- `concepts/operations.md` — expanded operation workflows
- `concepts/llm-wiki-pattern.md` — the pattern this wiki implements
- [Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — the original source