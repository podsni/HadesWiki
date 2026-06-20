---
title: Wiki Graph
created: 2026-06-12
updated: 2026-06-12
type: meta
tags: [meta, navigation, graph, interactive]
sources: []
---

# Wiki Graph View

An interactive map of every page in the wiki and how they connect.
Hover over nodes to see the title; click to navigate.

## How to read this

- **Each box** is one wiki page.
- **Each arrow** `A → B` means page A contains a `[[B]]` wikilink.
- **Color & shape** group pages by type (concept, comparison, etc.).
- **Click** a box to navigate to that page.
- **Scroll** to zoom, **drag** to pan inside the diagram.

## Full graph

```mermaid
graph LR
  classDef concept fill:#7c4dff,stroke:#311b92,color:#fff
  classDef comparison fill:#ff6e40,stroke:#bf360c,color:#fff
  classDef entity fill:#26a69a,stroke:#00695c,color:#fff
  classDef query fill:#42a5f5,stroke:#0d47a1,color:#fff
  classDef summary fill:#ab47bc,stroke:#4a148c,color:#fff
  classDef schema fill:#78909c,stroke:#263238,color:#fff
  classDef meta fill:#9e9e9e,stroke:#212121,color:#fff

  agent["Agent"]:::page
  click agent "/AGENT/" "Go to Agent"
  guide["Guide"]:::page
  click guide "/GUIDE/" "Go to Guide"
  catalog["Catalog"]:::page
  click catalog "/catalog/" "Go to Catalog"
  rag_vs_llm_wiki["RAG vs LLM Wiki"]:::comparison
  click rag_vs_llm_wiki "/comparisons/rag-vs-llm-wiki/" "Go to RAG vs LLM Wiki"
  llm_wiki_pattern["LLM Wiki Pattern"]:::concept
  click llm_wiki_pattern "/concepts/llm-wiki-pattern/" "Go to LLM Wiki Pattern"
  memex["Memex"]:::concept
  click memex "/concepts/memex/" "Go to Memex"
  obsidian["Obsidian"]:::concept
  click obsidian "/concepts/obsidian/" "Go to Obsidian"
  operations["Operations"]:::concept
  click operations "/concepts/operations/" "Go to Operations"
  qmd["qmd"]:::concept
  click qmd "/concepts/qmd/" "Go to qmd"
  source_karpathy_llm_wiki["Source — Karpathy's LLM Wiki gist"]:::summary
  click source_karpathy_llm_wiki "/concepts/source-karpathy-llm-wiki/" "Go to Source — Karpathy's LLM Wiki gist"
  karpathy["Andrej Karpathy"]:::entity
  click karpathy "/entities/karpathy/" "Go to Andrej Karpathy"
  graph["Wiki Graph"]:::meta
  click graph "/graph/" "Go to Wiki Graph"
  index["Index"]:::page
  click index "/index/" "Go to Index"
  log["Log"]:::page
  click log "/log/" "Go to Log"
  synthesis_web_vs_rag_vs_llm_wiki["Synthesis — LLM Wiki vs the Web vs RAG"]:::query
  click synthesis_web_vs_rag_vs_llm_wiki "/queries/synthesis-web-vs-rag-vs-llm-wiki/" "Go to Synthesis — LLM Wiki vs the Web vs RAG"
  schema["HadesWiki Schema"]:::schema
  click schema "/schema/" "Go to HadesWiki Schema"
  tags["Tag Index"]:::meta
  click tags "/tags/" "Go to Tag Index"

  catalog --> karpathy
  catalog --> llm_wiki_pattern
  catalog --> memex
  catalog --> obsidian
  catalog --> operations
  catalog --> qmd
  catalog --> rag_vs_llm_wiki
  catalog --> schema
  catalog --> source_karpathy_llm_wiki
  catalog --> synthesis_web_vs_rag_vs_llm_wiki
  comparisons_rag_vs_llm_wiki --> catalog
  comparisons_rag_vs_llm_wiki --> llm_wiki_pattern
  comparisons_rag_vs_llm_wiki --> obsidian
  comparisons_rag_vs_llm_wiki --> operations
  comparisons_rag_vs_llm_wiki --> qmd
  concepts_llm_wiki_pattern --> karpathy
  concepts_llm_wiki_pattern --> memex
  concepts_llm_wiki_pattern --> obsidian
  concepts_llm_wiki_pattern --> operations
  concepts_llm_wiki_pattern --> rag_vs_llm_wiki
  concepts_llm_wiki_pattern --> schema
  concepts_memex --> llm_wiki_pattern
  concepts_memex --> operations
  concepts_obsidian --> karpathy
  concepts_obsidian --> llm_wiki_pattern
  concepts_obsidian --> operations
  concepts_obsidian --> qmd
  concepts_obsidian --> schema
  concepts_operations --> catalog
  concepts_operations --> llm_wiki_pattern
  concepts_operations --> log
  concepts_operations --> rag_vs_llm_wiki
  concepts_operations --> schema
  concepts_qmd --> catalog
  concepts_qmd --> llm_wiki_pattern
  concepts_qmd --> operations
  concepts_source_karpathy_llm_wiki --> catalog
  concepts_source_karpathy_llm_wiki --> karpathy
  concepts_source_karpathy_llm_wiki --> llm_wiki_pattern
  concepts_source_karpathy_llm_wiki --> log
  concepts_source_karpathy_llm_wiki --> memex
  concepts_source_karpathy_llm_wiki --> obsidian
  concepts_source_karpathy_llm_wiki --> operations
  concepts_source_karpathy_llm_wiki --> qmd
  concepts_source_karpathy_llm_wiki --> rag_vs_llm_wiki
  entities_karpathy --> llm_wiki_pattern
  entities_karpathy --> memex
  entities_karpathy --> obsidian
  entities_karpathy --> operations
  graph --> catalog
  graph --> llm_wiki_pattern
  graph --> tags
  queries_synthesis_web_vs_rag_vs_llm_wiki --> catalog
  queries_synthesis_web_vs_rag_vs_llm_wiki --> llm_wiki_pattern
  queries_synthesis_web_vs_rag_vs_llm_wiki --> memex
  queries_synthesis_web_vs_rag_vs_llm_wiki --> operations
  queries_synthesis_web_vs_rag_vs_llm_wiki --> qmd
  queries_synthesis_web_vs_rag_vs_llm_wiki --> rag_vs_llm_wiki
  tags --> catalog
  tags --> graph
  tags --> schema

```

## Stats

- **17** unique pages
- **61** wikilink connections
- **45** total tags

## Pages by type

### 💡 Concepts (5)

- [LLM Wiki Pattern](/concepts/llm-wiki-pattern/)
- [Memex](/concepts/memex/)
- [Obsidian](/concepts/obsidian/)
- [Operations](/concepts/operations/)
- [qmd](/concepts/qmd/)

### ⚖️ Comparisons (1)

- [RAG vs LLM Wiki](/comparisons/rag-vs-llm-wiki/)

### 👤 Entities (1)

- [Andrej Karpathy](/entities/karpathy/)

### 🔍 Queries (1)

- [Synthesis — LLM Wiki vs the Web vs RAG](/queries/synthesis-web-vs-rag-vs-llm-wiki/)

### 📄 Sources (1)

- [Source — Karpathy's LLM Wiki gist](/concepts/source-karpathy-llm-wiki/)

### ⚙️ Schema (1)

- [HadesWiki Schema](/schema/)

### 🛠️ Meta (2)

- [Tag Index](/tags/)
- [Wiki Graph](/graph/)

---

## Related

- [[catalog|Wiki Catalog]] — text-based listing of all pages
- [[tags|Tag Index]] — browse by topic tag
- [[llm-wiki-pattern]] — the pattern this wiki implements

> This page is auto-generated from the wiki source. To regenerate,
> run `python scripts/build_graph.py` or push a change that touches
> wiki content — CI will rebuild and re-deploy.