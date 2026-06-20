---
title: RAG vs LLM Wiki
created: 2026-06-12
updated: 2026-06-12
type: comparison
tags: [comparison, rag, vs, knowledge-base]
sources: [raw/articles/karpathy-llm-wiki.md]
confidence: high
---

# RAG vs LLM Wiki

Side-by-side comparison of two paradigms for getting LLM answers from a document
corpus. Karpathy positions the LLM Wiki pattern as fundamentally different from
RAG, not just a tooling variant. ^[raw/articles/karpathy-llm-wiki.md]

## At a Glance

| Dimension | RAG | LLM Wiki |
|---|---|---|
| When work happens | At query time | At ingest time |
| Knowledge lifecycle | Re-derived every query | Compiled once, kept current |
| Cross-references | None by default | Built and maintained by the LLM |
| Contradiction handling | Lost between retrievals | Flagged and recorded |
| Cost per query | Embedding search + LLM call | LLM reads pre-synthesized pages |
| Cost at ingest | Indexing only | Indexing + summary + cross-ref updates |
| Scales with | Corpus size | Wiki page count |
| Source of truth | Raw chunks | Raw sources + the wiki itself |
| Output format | Free-form answer | Markdown, table, slide deck, chart, canvas |

^[raw/articles/karpathy-llm-wiki.md]

## When RAG Wins

- One-shot analysis of a corpus you won't revisit (legal discovery, single research sprint)
- Corpora so large that the wiki itself would be unwieldy (10k+ documents, fast-moving news feeds)
- Sources where chunk-level retrieval is essential (specific facts buried in long docs)
- The user can't or won't curate a wiki (transient teammates, ephemeral projects)

## When the LLM Wiki Wins

- Knowledge you want to keep and build on (research programmes, lifelong hobbies)
- Domains where cross-document synthesis matters more than specific fact lookup
- Where contradictions between sources matter and need to be tracked explicitly
- When the same questions get asked repeatedly in slightly different forms
- Personal knowledge bases — self-improvement, learning a field, reading a series

## Hybrid

They aren't mutually exclusive. A wiki can:

- Ingest from a RAG system (RAG finds the chunks, LLM extracts and files them)
- Use [[qmd]] or similar BM25/vector search over wiki pages when the [[index]] is
  too small to navigate a large corpus
- Embed wiki pages for retrieval-augmented chat where the synthesis itself is the
  corpus being searched

## Verdict

For a personal knowledge base the user wants to grow over time, the LLM Wiki
pattern dominates RAG — not because RAG is wrong, but because the maintenance cost
that RAG avoids at ingest is the same cost that makes the corpus stale at query
time. The wiki pays that cost once; RAG pays it forever. ^[raw/articles/karpathy-llm-wiki.md]

## Related

- [[llm-wiki-pattern]] — the pattern itself
- [[qmd]] — hybrid search when the wiki outgrows the index file
- [[operations]] — ingest/query/lint workflows
- [[obsidian]] — typical IDE for browsing the wiki