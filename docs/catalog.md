# Index

> Content catalog for HadesWiki. Every wiki page listed under its type with a
> one-line summary. Read this first to find relevant pages for any query.
> Last updated: 2026-06-12 | Total pages: 10

## Entities

- [[karpathy|karpathy]] — Andrej Karpathy; author of the [[llm-wiki-pattern]] idea file that bootstrapped this wiki.

## Concepts

- [[llm-wiki-pattern|llm-wiki-pattern]] — Karpathy's pattern: LLM incrementally builds and maintains a persistent wiki instead of doing RAG per query.
- [[operations|operations]] — The three core operations an LLM performs against the wiki: ingest, query, lint.
- [[memex|memex]] — Vannevar Bush's 1945 vision for a personal curated knowledge store with associative trails; the historical antecedent of the wiki pattern.
- [[obsidian|obsidian]] — Markdown editor and graph viewer; Karpathy's recommended IDE for browsing the wiki while the LLM agent writes to it.
- [[qmd|qmd]] — Local BM25 + vector + LLM-reranked search over markdown; supplements [[catalog]] when the wiki outgrows simple catalog navigation.
- [[source-karpathy-llm-wiki|source-karpathy-llm-wiki]] — Summary page for the raw ingest of Karpathy's gist; lists every wiki page it touched.

## Comparisons

- [[rag-vs-llm-wiki|rag-vs-llm-wiki]] — RAG rediscovers per query; the LLM Wiki compiles once and keeps current. When each wins, and how to hybridize.

## Queries

- [[synthesis-web-vs-rag-vs-llm-wiki|synthesis-web-vs-rag-vs-llm-wiki]] — Filed synthesis: where the LLM Wiki sits between the Web and RAG, and why "persistent, compounding" is the distinguishing property.

## Schema

- [[schema|schema]] — Conventions, tag taxonomy, frontmatter spec, orientation workflow, page thresholds, pitfalls.

## Raw sources

- [karpathy-llm-wiki.md](raw/articles/karpathy-llm-wiki.md) — The canonical Karpathy gist (sha256 `dc3efe98…`); immutable.