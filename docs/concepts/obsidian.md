---
title: Obsidian
created: 2026-06-12
updated: 2026-06-12
type: concept
tags: [tool, editor, obsidian]
sources: [raw/articles/karpathy-llm-wiki.md]
confidence: high
---

# Obsidian

Markdown-based knowledge-base editor. The typical IDE for browsing an
[[llm-wiki-pattern|LLM Wiki]] — the user keeps it open while the LLM agent writes
in the same directory. Karpathy's exact framing: "Obsidian is the IDE; the LLM is
the programmer; the wiki is the codebase." ^[raw/articles/karpathy-llm-wiki.md]

## Why Obsidian Fits

- **Plain markdown files** — the wiki is just a directory of `.md` files.
  No proprietary format, no database.
- **`[[wikilinks]]`** render as clickable cross-references between pages.
- **Graph View** — visualizes the wiki as a node-edge graph. Best way to see the
  shape of the wiki: hubs, orphans, isolated clusters. ^[raw/articles/karpathy-llm-wiki.md]
- **YAML frontmatter** powers Dataview queries and matches the [[schema]] convention.
- **Plugins**:
  - [Obsidian Web Clipper](https://obsidian.md/clipper) — converts web articles
    to markdown for the `raw/` collection. ^[raw/articles/karpathy-llm-wiki.md]
  - **Marp** — markdown slide decks generated from wiki content. ^[raw/articles/karpathy-llm-wiki.md]
  - **Dataview** — queries over page frontmatter (tags, dates, source counts).
    ^[raw/articles/karpathy-llm-wiki.md]

## Setup Tips

- **Attachment folder**: set to `raw/assets/` so clipped images land in the
  raw collection (the LLM can view them, URLs don't break). ^[raw/articles/karpathy-llm-wiki.md]
- **Hotkey for "Download attachments for current file"** — bind to `Ctrl+Shift+D`
  to pull all images from a clipped article to local disk in one keystroke.
  ^[raw/articles/karpathy-llm-wiki.md]
- **Wikilinks** — usually on by default.

## Limitations Noted by Karpathy

LLMs can't natively read markdown with inline images in one pass — the workaround
is to have the LLM read the text first, then view some or all of the referenced
images separately to gain additional context. Clunky but works. ^[raw/articles/karpathy-llm-wiki.md]

## Related

- [[llm-wiki-pattern]] — the pattern Obsidian typically hosts
- [[qmd]] — search tool that complements Obsidian at scale
- [[operations]] — workflows the IDE supports
- [[karpathy]] — recommends Obsidian as the IDE