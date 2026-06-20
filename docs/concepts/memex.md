---
title: Memex
created: 2026-06-12
updated: 2026-06-12
type: concept
tags: [concept, history, memex, hypertext]
sources: [raw/articles/karpathy-llm-wiki.md]
confidence: high
---

# Memex

Vannevar Bush's 1945 vision for a personal, curated knowledge store with
**associative trails** between documents. Described in his essay
*"As We May Think"* (Atlantic Monthly, July 1945). Karpathy positions the
[[llm-wiki-pattern|LLM Wiki]] as the modern realization of Memex — closer in spirit
to what the web *should* have been than to what it became. ^[raw/articles/karpathy-llm-wiki.md]

## Why It Matters for the LLM Wiki Pattern

Bush's vision was **private, actively curated**, with the connections between
documents as valuable as the documents themselves. This is precisely what the LLM
Wiki builds. The part Bush couldn't solve was **who does the maintenance** —
associative trails were supposed to be hand-built by users. ^[raw/articles/karpathy-llm-wiki.md]

The LLM Wiki pattern claims to solve this: the LLM touches 15 files in one pass,
doesn't get bored, doesn't forget to update a cross-reference. The cost of
maintenance is near zero, so the trails actually stay current.

## Relationship to the Web

Bush's Memex is closer to what the LLM Wiki is than to what the WWW became:

| | Memex / LLM Wiki | WWW |
|---|---|---|
| Curation | Private, active | Public, passive |
| Trails | First-class | Broken (404s, link rot) |
| Maintenance | Solved by LLM | Nobody |
| Discovery | User-driven | Algorithmic |

^[raw/articles/karpathy-llm-wiki.md]

## Related

- [[llm-wiki-pattern]] — modern realization
- [[operations]] — how the LLM Wiki keeps the trails current

> Related tradition not yet ingested: Niklas Luhmann's Zettelkasten — a German
> equivalent tradition of cross-referenced index cards, analogue forefather of
> the digital wiki.