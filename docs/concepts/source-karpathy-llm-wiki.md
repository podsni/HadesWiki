---
title: Source — Karpathy's LLM Wiki gist
created: 2026-06-12
updated: 2026-06-12
type: summary
tags: [source, article, gist, karpathy]
sources: [raw/articles/karpathy-llm-wiki.md]
confidence: high
---

# Source: Karpathy's "LLM Wiki" gist

The canonical reference for the [[llm-wiki-pattern|LLM Wiki pattern]] and the
primary raw source for this entire wiki.

## Identity

- **URL**: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- **Author**: [[karpathy]]
- **Format**: Markdown gist, 75 lines, ~12 KB
- **Ingested**: 2026-06-12
- **sha256**: `dc3efe98ae62f23dd08acad13aba2e95287beb20b6bec2f4af0423557fe37401`
  (verified against the body below the frontmatter)

The sha256 is stored on the raw file's frontmatter so a future re-ingest can
detect source drift in one comparison.

## Structure of the Gist

| Section | Purpose |
|---|---|
| The core idea | Why this isn't RAG |
| Architecture | Three layers: raw / wiki / schema |
| Operations | Ingest, query, lint |
| Indexing and logging | `catalog.md` and `log.md` |
| Optional: CLI tools | [[qmd]] mentioned |
| Tips and tricks | [[obsidian]] Web Clipper, Marp, Dataview, graph view |
| Why this works | Maintenance cost near zero; LLM doesn't get bored |
| Note | The document is intentionally abstract — instantiate with your LLM |

## What It Gives Us

The gist gives us:

1. **The pattern itself** → [[llm-wiki-pattern]]
2. **A division of labor** between human and LLM
3. **The three core operations** → [[operations]]
4. **A historical antecedent** → [[memex]]
5. **The recommended tooling** → [[obsidian]], [[qmd]]
6. **An author** → [[karpathy]]

## Pages Touched by This Ingest

- [[llm-wiki-pattern]] — concept, the pattern itself
- [[rag-vs-llm-wiki]] — comparison
- [[operations]] — concept, three operations
- [[memex]] — concept, historical antecedent
- [[obsidian]] — concept, typical IDE
- [[qmd]] — concept, search tool
- [[karpathy]] — entity, the author
- [[catalog]] — content catalog (updated)
- [[log]] — chronological action log (updated)

## Re-ingest Behavior

If the gist changes, recompute sha256 on the body, compare to stored
`dc3efe98ae62f23dd08acad13aba2e95287beb20b6bec2f4af0423557fe37401`. Identical →
skip. Different → flag drift, then re-ingest following [[operations|the ingest workflow]].

## Related

- [raw/articles/karpathy-llm-wiki.md](../raw/articles/karpathy-llm-wiki.md) — the raw source
   (Note: link is relative to repo root. In the published site, see the "Raw
   Sources" section in the nav.)
- [[llm-wiki-pattern]] — what the source describes
- [[operations]] — how the source was processed