---
title: LLM Wiki Pattern
created: 2026-06-12
updated: 2026-06-12
type: concept
tags: [pattern, methodology, knowledge-base, architecture]
sources: [raw/articles/karpathy-llm-wiki.md]
confidence: high
---

# LLM Wiki Pattern

Andrej Karpathy's pattern for building personal knowledge bases with an LLM. Instead
of retrieving from raw documents at query time (RAG), the LLM **incrementally builds
and maintains a persistent wiki** — a structured, interlinked collection of markdown
files that sits between the user and the raw sources. ^[raw/articles/karpathy-llm-wiki.md]

## Core Idea

The wiki is a persistent, compounding artifact. Cross-references are already there.
Contradictions have already been flagged. Synthesis already reflects everything the
user has read. The wiki keeps getting richer with every source added and every question
asked. ^[raw/articles/karpathy-llm-wiki.md]

The critical difference vs [[rag-vs-llm-wiki|RAG]]: RAG rediscovers knowledge from
scratch per query; the wiki compiles it once and keeps it current. Ask a subtle
question that requires synthesizing five documents — under RAG the LLM has to find and
piece together the relevant fragments every time; under the wiki pattern it just reads
the pre-synthesized pages.

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Raw sources (immutable)                            │
│   raw/articles/  raw/papers/  raw/transcripts/  raw/assets/ │
│   LLM reads, never modifies. Source of truth.               │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: The wiki (LLM-owned, mutable)                      │
│   entities/  concepts/  comparisons/  queries/               │
│   LLM creates, updates, cross-references, reconciles.       │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: The schema (co-evolved with the LLM)               │
│   SCHEMA.md / CLAUDE.md / AGENTS.md                         │
│   Conventions, tag taxonomy, workflows, page thresholds.    │
└─────────────────────────────────────────────────────────────┘
```

^[raw/articles/karpathy-llm-wiki.md]

## Division of Labor

- **Human**: sourcing, exploration, asking the right questions, curating, deciding
  what matters.
- **LLM**: all grunt work — summarizing, cross-referencing, filing, bookkeeping,
  reconciling contradictions.

The user rarely writes the wiki themselves. Karpathy's exact framing: "Obsidian is
the IDE; the LLM is the programmer; the wiki is the codebase." ^[raw/articles/karpathy-llm-wiki.md]

## Use Cases

| Domain | What gets ingested | What gets built |
|---|---|---|
| Personal | Journal entries, articles, podcast notes | Structured picture of self |
| Research | Papers, articles, reports | Wiki with evolving thesis |
| Reading a book | Chapter summaries | Character/theme/plot pages — companion wiki like Tolkien Gateway |
| Business / team | Slack threads, meeting transcripts, customer calls | Internal wiki with humans in the loop |
| Tactical | Competitive intel, due diligence, trip planning, course notes, hobby deep-dives | Anything that accumulates over time |

^[raw/articles/karpathy-llm-wiki.md]

## Why It Works

Humans abandon wikis because maintenance burden grows faster than value. LLMs don't
get bored, don't forget to update cross-references, and can touch 15 files in one
pass. The wiki stays maintained because the cost of maintenance is near zero.
^[raw/articles/karpathy-llm-wiki.md]

The historical antecedent is [[memex|Vannevar Bush's Memex (1945)]] — a personal,
curated knowledge store with associative trails between documents. Bush's vision
was closer to this than to what the web became. The part he couldn't solve was who
does the maintenance. The LLM handles that.

## Related

- [[rag-vs-llm-wiki]] — side-by-side trade-offs
- [[operations]] — ingest / query / lint workflows
- [[schema]] — how this very wiki is configured
- [[karpathy]] — author of the pattern
- [[memex]] — historical antecedent
- [[obsidian]] — the typical IDE for browsing the wiki