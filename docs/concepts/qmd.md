---
title: qmd
created: 2026-06-12
updated: 2026-06-12
type: concept
tags: [tool, cli, search, bm25, vector-search, mcp]
sources: [raw/articles/karpathy-llm-wiki.md]
confidence: medium
---

# qmd

Local search engine for markdown files. Hybrid BM25/vector search with LLM
re-ranking, all on-device. The recommended [[operations|search tool]] when an
[[llm-wiki-pattern|LLM Wiki]] outgrows the [[index]] file approach. ^[raw/articles/karpathy-llm-wiki.md]

## Why It's Mentioned

At small scale the [[index]] file is enough to navigate a wiki — read it, identify
relevant pages, drill in. At larger scale (hundreds of pages, thousands of pages)
the index alone is insufficient: it can miss pages, especially for cross-cutting
queries that span multiple sections. ^[raw/articles/karpathy-llm-wiki.md]

qmd fills that gap:

- **Local** — runs on-device, no cloud, no API cost per query.
- **Hybrid retrieval** — BM25 (keyword) + vector embeddings + LLM re-ranking.
- **Two interfaces**:
  - **CLI** — the LLM can `shell out` to it from any agent.
  - **MCP server** — the LLM can use it as a native tool via the Model Context
    Protocol.

^[raw/articles/karpathy-llm-wiki.md]

## When to Adopt

- Wiki exceeds ~100 pages and [[index]] becomes unwieldy.
- Cross-cutting queries that span entities/concepts/comparisons.
- Bulk lint passes where you need to find every page mentioning a tag.

## Alternatives

Karpathy notes: "You could also build something simpler yourself — the LLM can
help you vibe-code a naive search script as the need arises." ^[raw/articles/karpathy-llm-wiki.md]

A bare-bones alternative is `grep -r` over the wiki + a tag index built from
frontmatter. Sufficient for wikis under a few hundred pages.

## Related

- [[operations]] — query workflow that may use qmd
- [[index]] — what qmd complements
- [[llm-wiki-pattern]] — the broader pattern qmd supports