# Log

> Chronological record of all wiki actions. Append-only.
> Format: `## [YYYY-MM-DD] action | subject`
> Actions: create, ingest, update, query, lint, archive, delete
> Rotation: when this file exceeds 500 entries, rename `log-YYYY.md`, start fresh.

## [2026-06-12] create | HadesWiki initialized
- Domain: knowledge-base methodology (Karpathy's LLM Wiki pattern)
- Path: /root/HadesWiki
- Structure created: raw/{articles,papers,transcripts,assets}/ + entities/ + concepts/ + comparisons/ + queries/ + _meta/
- Files written: SCHEMA.md, index.md, log.md

## [2026-06-12] ingest | Karpathy's "LLM Wiki" gist
- Source: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- Saved to: raw/articles/karpathy-llm-wiki.md (sha256 dc3efe98ae62f23dd08acad13aba2e95287beb20b6bec2f4af0423557fe37401)
- Pages created:
  - entities/karpathy.md
  - concepts/llm-wiki-pattern.md
  - concepts/operations.md
  - concepts/memex.md
  - concepts/obsidian.md
  - concepts/qmd.md
  - concepts/source-karpathy-llm-wiki.md
  - comparisons/rag-vs-llm-wiki.md
  - queries/synthesis-web-vs-rag-vs-llm-wiki.md
- Pages updated: index.md (catalog), log.md (this entry)
- Total pages: 10

## [2026-06-12] lint | Initial health-check
- Pages scanned: 12 (10 wiki pages + index + log)
- sha256 verify: ✓ PASS
- Broken wikilinks: 0
- Orphan pages: 0
- Frontmatter missing fields: 0
- Tags outside taxonomy: 0
- Pages > 200 lines: 0
- Pages with < 2 outbound wikilinks: 0
- Inbound link graph: llm-wiki-pattern=17 (hub), operations=13, memex=9, obsidian=7, qmd=8, rag-vs-llm-wiki=6, karpathy=6
- Fixes applied during this lint:
  - Removed stray leading newline in raw body → sha256 now matches
  - Replaced placeholder `[[page-a]]` / `[[page-b]]` / `[[links]]` in operations.md with prose
  - Removed `[[zettelkasten]]` placeholder link in memex.md (Zettelkasten noted in prose as not-yet-ingested)
  - Escaped literal `[[wikilinks]]` examples in schema.md
  - Added `sources: []` to schema.md frontmatter
  - Renamed `SCHEMA.md` → `schema.md` to match lowercase-hyphen convention and resolve case-mismatched `[[schema]]` links
  - Extended tag taxonomy with: operations, search, synthesis, karpathy

## [2026-06-12] create | README.md + AGENT.md + .gitignore
- README.md: human-facing overview, layout, quick-start, conventions, current state
- AGENT.md: operational playbook for LLM agents (orientation, ingest/query/lint workflows, frontmatter spec, pitfalls)
- .gitignore: excludes local-only files (Obsidian workspace, swap, build artifacts)

## [2026-06-12] commit | Initial commit
- Files: 14 (12 markdown + .gitignore + schema + index + log + AGENT + README + raw source)
- Total: 10 wiki pages + 3 navigation files + 1 gitignore
- Lint status before commit: ✓ ALL CLEAN

## [2026-06-12] push | Initial commit pushed to GitHub
- Remote: https://github.com/podsni/HadesWiki.git
- Visibility: public
- Description: "A personal knowledge base built with Karpathy's LLM Wiki pattern - LLM-maintained, persistent, compounding."
- Commit pushed: 147478e "Initial commit: HadesWiki (LLM Wiki pattern)"
- Files: 16 (1,316 insertions)
- License: MIT

## [2026-06-12] create | GUIDE.md — complete install + usage guide
- 22.7 KB comprehensive documentation
- Sections: Choose Your Role, Part 1 Installation (web/clone/Obsidian/LLM CLI/qmd/Pages),
  Part 2 Configuration, Part 3 Daily Usage (read/ingest/query/lint/edit),
  Part 4 Workflows by Role (Reader/Curator/Operator/Contributor),
  Part 5 Troubleshooting (8 common issues), Part 6 Reference
- README.md updated with deep-link to GUIDE.md sections
- Covers all 4 LLM CLI options: Codex / Claude Code / OpenCode / Hermes