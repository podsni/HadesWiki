---
title: Operations
created: 2026-06-12
updated: 2026-06-12
type: concept
tags: [operations, workflow, ingest, query, lint, maintenance]
sources: [raw/articles/karpathy-llm-wiki.md]
confidence: high
---

# Operations

The three core operations an LLM performs against an LLM Wiki: **ingest**, **query**,
and **lint**. Karpathy describes these as the entire surface area of the pattern.
^[raw/articles/karpathy-llm-wiki.md]

## Ingest

You drop a new source into `raw/` and tell the LLM to process it. Flow:

1. Capture the raw source (URL → `web_extract`; PDF → `web_extract`; paste → save to
   `raw/` subdirectory). Add `source_url`, `ingested`, and `sha256` frontmatter.
2. Discuss key takeaways with the user — what's interesting, what matters for the
   domain.
3. Check what already exists in [[index]] and across pages — entities/concepts
   may already be covered.
4. Write or update wiki pages:
   - **New entity/concept** only if it meets Page Thresholds (2+ source mentions or
     central to one source).
   - **Existing pages** get new information, updated facts, bumped `updated` dates.
   - **Cross-reference**: every new/updated page links to ≥2 other pages via
     `[[wikilinks]]`. Existing pages link back.
   - Tags must come from the [[schema|tag taxonomy]].
   - Provenance markers (`^[raw/articles/source.md]`) on paragraphs whose claims
     trace to a specific source.
   - Set `confidence` field for opinion-heavy, fast-moving, or single-source claims.
5. Update [[index]] — add new pages under correct section, alphabetically; bump
   "Total pages" and "Last updated".
6. Append to [[log]]: `## [YYYY-MM-DD] ingest | Source Title`, listing every file
   created or updated.
7. Report what changed — list every file created or updated to the user.

A single source can touch 10–15 wiki pages. This is normal and desired — it's the
compounding effect. ^[raw/articles/karpathy-llm-wiki.md]

## Query

You ask questions against the wiki. Flow:

1. Read [[index]] to identify relevant pages.
2. For wikis with 100+ pages, also `search_files` across all `.md` files —
   the index alone may miss content.
3. Read the relevant pages with `read_file`.
4. Synthesize an answer from compiled knowledge. Cite the wiki pages by name,
   e.g. "Based on `llm-wiki-pattern` and `rag-vs-llm-wiki`..."
5. **File valuable answers back** — if the answer is a substantial comparison,
   deep dive, or novel synthesis, create a page in `queries/` or `comparisons/`.
   Don't file trivial lookups.
6. Update [[log]] with the query and whether it was filed.

Output formats: markdown page, comparison table, slide deck (Marp), chart
(matplotlib), canvas. ^[raw/articles/karpathy-llm-wiki.md]

## Lint

Periodically ask the LLM to health-check the wiki. Things to check:

1. **Orphan pages** — zero inbound cross-references. Programmatic scan.
2. **Broken wikilinks** — cross-references pointing to non-existent pages.
3. **Index completeness** — every wiki page appears in [[index]].
4. **Frontmatter validation** — every page has required fields. Tags in taxonomy.
5. **Stale content** — `updated` date > 90 days older than the most recent source
   mentioning the same entities.
6. **Contradictions** — pages on same topic with conflicting claims. Surface
   `contested: true` and `contradictions:` frontmatter for review.
7. **Quality signals** — `confidence: low` pages, single-source pages without
   confidence field set.
8. **Source drift** — for each `raw/` file with `sha256:`, recompute and flag
   mismatches.
9. **Page size** — flag pages over 200 lines for splitting.
10. **Tag audit** — list all tags in use, flag any not in [[schema|taxonomy]].
11. **Log rotation** — if [[log]] exceeds 500 entries, rotate.
12. Report findings grouped by severity (broken links > orphans > source drift >
    contested pages > stale content > style issues).
13. Append to [[log]]: `## [YYYY-MM-DD] lint | N issues found`.

^[raw/articles/karpathy-llm-wiki.md]

## Related

- [[llm-wiki-pattern]] — the pattern itself
- [[schema]] — conventions the operations enforce
- [[index]] — content catalog updated on every ingest
- [[log]] — chronological action log
- [[rag-vs-llm-wiki]] — alternative paradigm