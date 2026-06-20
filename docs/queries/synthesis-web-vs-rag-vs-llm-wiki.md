---
title: Synthesis — LLM Wiki vs the Web vs RAG
created: 2026-06-12
updated: 2026-06-12
type: query
tags: [meta, synthesis, comparison]
sources: [raw/articles/karpathy-llm-wiki.md]
confidence: medium
---

# Synthesis — LLM Wiki vs the Web vs RAG

A filed query synthesis. Asked during initial ingest: "Where does the LLM Wiki
sit relative to the Web and to RAG?" — answer is non-obvious enough to be worth
keeping.

## The Three Systems

| | LLM Wiki | The Web | RAG |
|---|---|---|---|
| **Inception** | Karpathy's 2026 gist (crystallized in writing) | Berners-Lee, ~1989–1991 | Pre-LLM era, formalized 2020s |
| **Curation** | Private, LLM-driven | Public, hand-curated by sites | None at query time |
| **Connections** | Built and maintained by LLM | Hyperlinks; link rot is endemic | None by default |
| **Who maintains** | LLM (cheap) | Nobody (decentralized) | Nobody (re-derived per query) |
| **Failure mode** | LLM hallucination in synthesis | 404s, SEO spam | Retrieval misses; chunk boundaries |
| **Strength** | Cross-document synthesis at marginal cost | Global reach, public knowledge | Zero curation overhead for ephemeral corpora |
| **Cost** | LLM API per ingest | Free at read time | Embedding + retrieval + LLM per query |

## Where They Sit

The LLM Wiki is closer in spirit to [[memex]] than to the Web. It is also closer
in spirit to RAG than to the Web — both assume an LLM reads a corpus. The
fundamental difference is **when the work happens**:

- **RAG**: work at query time. Re-derive the answer from chunks every time.
- **LLM Wiki**: work at ingest time. Compile once, read cheaply thereafter.
- **Web**: work at publish time, never again. Hyperlinks decay.

^[raw/articles/karpathy-llm-wiki.md]

## Why "Persistent, Compounding" Matters

The phrase that distinguishes the wiki from the alternatives is "persistent,
compounding artifact." The wiki **accumulates**: every source, every query, every
lint pass leaves the wiki richer than before. RAG and the Web do not — they stay
the same shape regardless of how much you use them.

The compounding is what justifies the up-front ingest cost. You pay a one-time
synthesis tax; you never pay the retrieval tax again.

## A Diagram

```
  ┌──────────────────┐         ┌──────────────────┐
  │  LLM Wiki        │         │  RAG             │
  │                  │         │                  │
  │  raw ── ingest ──┼─► wiki  │  corpus ──index──┼─► chunks
  │                  │   ▲     │                  │   ▲
  │  query ──────────┼───┘     │  query ──────────┼───┘
  │                  │ cheap   │                  │ expensive
  │  compounds       │         │  re-derives      │
  └──────────────────┘         └──────────────────┘
            ▲                            ▲
            │                            │
            └────────── both use ────────┘
                      an LLM
```

## Open Questions

- Does the wiki scale past ~1000 pages without qmd-like search?
- Does the LLM's maintenance cost really stay near-zero at large wiki size, or does
  cross-reference complexity grow superlinearly?
- Can the wiki be safely edited by multiple humans without the LLM losing
  consistency? (Karpathy's framing assumes one human + one LLM.)

## Related

- [[llm-wiki-pattern]] — the pattern
- [[rag-vs-llm-wiki]] — closer comparison
- [[memex]] — historical antecedent
- [[operations]] — what makes the wiki compound
- [[qmd]] — when [[index]] isn't enough