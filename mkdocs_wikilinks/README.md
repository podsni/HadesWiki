# mkdocs-wikilinks-hades

A custom MkDocs plugin that resolves Obsidian-style wikilinks (`[[page-name]]`)
in markdown sources, with proper handling of code spans and code blocks.

## Features

- Resolves `[[page-name]]`, `[[page-name|display text]]`, `[[page-name#heading]]`
- Skips wikilinks inside inline code (`` `[[example]]` ``) and fenced code blocks
- Case-insensitive lookup by basename or full path
- Configurable alias map for redirecting old names
- Records backlinks and exposes them via the template context as `wikilinks_backlinks`
- Renders missing targets as styled spans (`<span class="wikilink-missing">`)
- Tiny — single file, no third-party deps beyond MkDocs itself

## Install

```bash
pip install -e .    # local editable install
# or
pip install .        # local install
```

## Enable

```yaml
# mkdocs.yml
plugins:
  - search
  - wikilinks:
      aliases:
        # Map alternate names to existing pages
        catalog: catalog
        index: catalog
      ignore_missing: false
      missing_class: wikilink-missing
```

## Why a custom plugin?

The default `mkdocs-roamlinks-plugin` doesn't know about code spans or code
blocks, so any literal `[[xxx]]` example written inside backticks produces a
spurious warning. This plugin stashes code spans/blocks to placeholders before
scanning, then restores them — so `[[page-name]]` is a link but
`` `[[example]]` `` stays literal.

## License

MIT — see repo LICENSE.