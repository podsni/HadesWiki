# HadesWiki — Complete Installation & Usage Guide

This is the comprehensive guide for installing, configuring, and using HadesWiki.
Pick the path that matches your role and follow the steps.

## Table of Contents

- [Choose Your Role](#choose-your-role)
- [Part 1: Installation](#part-1-installation)
  - [1.1 — Web Browser (zero install)](#11-web-browser-zero-install)
  - [1.2 — Clone the Repo](#12-clone-the-repo)
  - [1.3 — Obsidian Desktop (recommended reader)](#13-obsidian-desktop-recommended-reader)
  - [1.4 — LLM CLI Agent](#14-llm-cli-agent)
  - [1.5 — Search Tooling (qmd)](#15-search-tooling-qmd)
  - [1.6 — Optional: GitHub Publishing](#16-optional-github-publishing)
- [Part 2: Configuration](#part-2-configuration)
- [Part 3: Daily Usage](#part-3-daily-usage)
  - [3.1 — Reading & Browsing](#31-reading-browsing)
  - [3.2 — Adding a Source](#32-adding-a-source)
  - [3.3 — Asking Questions](#33-asking-questions)
  - [3.4 — Lint & Maintenance](#34-lint-maintenance)
  - [3.5 — Editing Pages Manually](#35-editing-pages-manually)
- [Part 4: Workflows by Role](#part-4-workflows-by-role)
- [Part 5: Troubleshooting](#part-5-troubleshooting)
- [Part 6: Reference](#part-6-reference)

---

## Choose Your Role

HadesWiki serves four roles. Install only what your role needs.

| Role | Goal | What you install |
|---|---|---|
| **Reader** | Browse, search, follow links | Obsidian (or web browser) |
| **Curator** | Add sources, decide what gets ingested, ask questions | Obsidian + LLM CLI + git |
| **Operator** | Run an LLM agent that maintains the wiki | LLM CLI + git + (optional) qmd |
| **Contributor** | Submit PRs, edit pages, fix issues | All of the above + gh CLI |

A typical **full setup** (Operator + Curator on a Linux/macOS machine) requires:

| Tool | Required for | Install size | Source |
|---|---|---|---|
| `git` | Clone, sync, version control | ~50 MB | system package manager |
| `gh` | GitHub integration (create issues, PRs) | ~100 MB | https://cli.github.com |
| Obsidian | Browse, edit, graph view | ~250 MB | https://obsidian.md |
| An LLM CLI | Run the agent | varies | see § 1.4 |
| `qmd` (optional) | Local BM25+vector search when wiki > 100 pages | ~50 MB | https://github.com/tobi/qmd |
| `curl`, `sha256sum` | Capture sources | already on macOS/Linux | system |

A **minimal setup** (Reader only) is: open the GitHub repo in a browser. No
install needed at all.

---

## Part 1: Installation

### 1.1 — Web Browser (zero install)

**Time:** 30 seconds · **Platform:** any · **Skill:** none

The fastest way to read HadesWiki:

1. Open **https://github.com/podsni/HadesWiki** in any browser
2. Click any `.md` file to read it rendered as HTML by GitHub
3. Click `[[wikilinks]]` ... wait, those don't render on GitHub. Skip them.
4. For real cross-linking, use Obsidian (§ 1.3) or clone (§ 1.2).

**Pros:** zero setup, works anywhere, free.
**Cons:** no graph view, no live wikilink navigation, can't edit.

### 1.2 — Clone the Repo

**Time:** 1 minute · **Platform:** macOS / Linux / Windows · **Skill:** basic terminal

You need git. If you don't have it:

```bash
# macOS (Xcode Command Line Tools)
xcode-select --install

# Debian / Ubuntu
sudo apt install git

# Fedora / RHEL
sudo dnf install git

# Windows
winget install Git.Git
```

Clone HadesWiki:

```bash
git clone https://github.com/podsni/HadesWiki.git ~/HadesWiki
cd ~/HadesWiki

# Optional: pin to a specific version, or stay on main for the latest
git checkout main
git pull            # sync later
```

Verify:

```bash
ls ~/HadesWiki
# README.md  AGENT.md  schema.md  catalog.md  log.md  .gitignore
# raw/  entities/  concepts/  comparisons/  queries/
```

That's it — you now have the full wiki locally. From here you can:

- **Read** with any text editor (VS Code, Sublime, Vim, nano, etc.)
- **Browse** with Obsidian (§ 1.3)
- **Run an agent** on it (§ 1.4)

### 1.3 — Obsidian Desktop (recommended reader)

**Time:** 5 minutes · **Platform:** macOS / Windows / Linux · **Skill:** none

Obsidian is the IDE Karpathy recommends for browsing the wiki:

> "Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase."

**Install:**

1. Download from https://obsidian.md/download
2. Run the installer (`.dmg` / `.exe` / `.AppImage` / `.deb`)
3. Launch Obsidian

**Open as vault:**

1. Click **Open folder as vault** (or `Cmd/Ctrl + O`)
2. Navigate to `~/HadesWiki` (or wherever you cloned)
3. Click **Open**

**Recommended settings** (one-time, applies vault-wide):

- **Settings → Files & links**
  - **New link format:** `Shortest path when possible`
  - **Use [[Wikilinks]]:** ✓ on
  - **Always update internal links:** ✓ on
  - **Default location for new attachments:** `raw/assets` (so clipped images land in the immutable source layer)
- **Settings → Appearance**
  - Theme: any (Basica, Minimal, or your favourite)
- **Settings → Community plugins** (optional but powerful)
  - Install **Dataview** — runs queries over page frontmatter
  - Install **Marp** — generates slide decks from wiki content
  - Install **Obsidian Web Clipper** — converts web articles to markdown for the `raw/` collection
  - Install **Graph Analysis** — enhanced graph view with filters

**Try the graph view:**

1. Press `Cmd/Ctrl + G` (or click the graph icon in the sidebar)
2. You should see `llm-wiki-pattern` as the central hub with spokes to all other pages
3. Hover any node → see connected pages
4. Filter (top-right): uncheck "Attachments" and "Existing files only"

**Hotkey to bind** (Settings → Hotkeys, search "Download attachments"):

- `Cmd/Ctrl + Shift + D` — pull all images from current file to local disk

### 1.4 — LLM CLI Agent

**Time:** 5–15 minutes · **Platform:** macOS / Linux · **Skill:** comfortable with terminal

The wiki is LLM-maintained, so installing an LLM CLI is essential if you want
to actually grow it. Pick ONE of the following:

#### Option A — OpenAI Codex CLI (recommended)

```bash
# Install
npm install -g @openai/codex

# Authenticate
codex login

# Verify
codex --version
```

#### Option B — Claude Code

```bash
# Install (macOS / Linux)
curl -fsSL https://claude.ai/install.sh | sh

# Authenticate — browser opens for OAuth
claude auth login

# Verify
claude --version
```

#### Option C — OpenCode

```bash
# Install
curl -fsSL https://opencode.ai/install | bash

# Configure provider (one of Anthropic / OpenAI / OpenRouter / etc.)
# See https://opencode.ai/docs

# Verify
opencode --version
```

#### Option D — Hermes Agent (this conversation's platform)

```bash
# Install
curl -fsSL https://hermes-agent.nousresearch.com/install | bash

# Configure
hermes setup

# Verify
hermes --version
```

#### Auto-discover `AGENT.md`

Most modern LLM CLIs auto-load project-level instruction files. To verify yours
does:

```bash
cd ~/HadesWiki
codex "what is this repo"   # or claude / opencode / hermes
```

If the agent reads `AGENT.md` automatically, you'll see it mention the
orientation workflow, the directory map, and the three operations. If not,
paste the contents of `AGENT.md` into your first message manually.

### 1.5 — Search Tooling (qmd)

**Time:** 5 minutes · **Platform:** macOS / Linux · **Skill:** comfortable with terminal

Skip this until your wiki exceeds ~100 pages. Below that, `catalog.md` plus
`grep` is enough.

**Install qmd:**

```bash
# Option A: download release binary
curl -fsSL https://github.com/tobi/qmd/releases/latest/download/qmd-linux-amd64 -o ~/.local/bin/qmd
chmod +x ~/.local/bin/qmd

# Option B: from source (needs Go 1.22+)
go install github.com/tobi/qmd@latest

# Add to PATH if not already
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Index the wiki
cd ~/HadesWiki
qmd index

# Query
qmd search "how do I ingest a source"
```

qmd exposes both a **CLI** (you can shell out from any agent) and an **MCP
server** (your agent can use it as a native tool). See
https://github.com/tobi/qmd for the MCP setup.

**Alternatives if you don't want qmd:**

```bash
# Pure grep over the wiki — works for any size
cd ~/HadesWiki
grep -r "topic" entities/ concepts/ comparisons/ queries/ --include="*.md" -l

# ripgrep (faster)
rg "topic" entities/ concepts/ comparisons/ queries/

# Dataview in Obsidian (no terminal) — write inline queries in any note
```

### 1.6 — Optional: GitHub Publishing

To publish the wiki as a public website (read-only):

**Option A — GitHub Pages:**

1. Settings → Pages → Source: `main` branch, `/ (root)`
2. Wait ~1 minute
3. Visit `https://<your-username>.github.io/HadesWiki`
4. Note: GitHub Pages renders markdown but doesn't natively expand
   `[[wikilinks]]` — use a static-site generator for that.

**Option B — Obsidian Publish:**

1. Settings → Sync → Publish (paid add-on, ~$8/month)
2. One-click publish to a custom domain or `publish.obsidian.md/<your-id>`

**Option C — MkDocs + mkdocs-material:**

```bash
pip install mkdocs mkdocs-material
cd ~/HadesWiki
# Create mkdocs.yml:
cat > mkdocs.yml <<EOF
site_name: HadesWiki
theme: material
docs_dir: .
nav:
  - Home: README.md
  - Index: catalog.md
  - Schema: schema.md
  - Agent: AGENT.md
  - Log: log.md
EOF
mkdocs serve    # local preview at http://localhost:8000
mkdocs gh-deploy   # pushes to gh-pages branch
```

---

## Part 2: Configuration

Most users won't need to configure anything beyond what Obsidian handles
automatically. Power users may want to:

### Configure Obsidian Dataview for the wiki

Create `~/HadesWiki/.obsidian/snippets/dataview-hadeswiki.css` (optional) to
style Dataview tables. Then enable in Settings → Appearance → CSS snippets.

Sample Dataview queries you can paste into any note:

```dataview
TABLE type, updated, tags
FROM "concepts" OR "entities"
SORT updated DESC
```

```dataview
LIST rows.file.link
FROM "raw"
SORT file.mtime DESC
LIMIT 5
```

### Configure your LLM CLI to load `AGENT.md`

Most CLIs auto-load it. To force-load explicitly:

```bash
# Codex
codex --instructions "$(cat AGENT.md)" "list wiki pages"

# Claude Code
claude --system-prompt-file AGENT.md "list wiki pages"

# OpenCode
opencode --system AGENT.md "list wiki pages"
```

### Configure git identity (if not already)

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Configure remote URL (if you forked)

```bash
cd ~/HadesWiki
git remote set-url origin git@github.com:<your-username>/HadesWiki.git
```

---

## Part 3: Daily Usage

### 3.1 — Reading & Browsing

**In Obsidian:**

| Action | How |
|---|---|
| Open the catalog | Click `catalog.md` in the file panel |
| See activity timeline | Click `log.md` |
| Visualize page graph | Press `Cmd/Ctrl + G` |
| Follow a wikilink | `Cmd/Ctrl + Click` on any `[[link]]` |
| Search across wiki | `Cmd/Ctrl + Shift + F` |
| Open recently visited | `Cmd/Ctrl + O` |
| Switch between pages | `Cmd/Ctrl + Alt + ←/→` |

**In a terminal:**

```bash
cd ~/HadesWiki

# List all pages
find . -name "*.md" -not -path "./raw/*" | sort

# Read the catalog
less catalog.md

# Grep for a topic
grep -rn "your topic" entities/ concepts/ comparisons/ queries/

# Open a page
cat concepts/operations.md | less
```

**On GitHub:**

- Visit https://github.com/podsni/HadesWiki
- Browse files via the file tree
- Note: wikilinks don't render natively — you'll see `[[links]]` as plain text

### 3.2 — Adding a Source

The full source-ingest workflow has two halves: **capture** (human) and
**process** (LLM agent).

#### Step 1 — Capture the source

Choose the right `raw/` subdirectory:

- Web article, blog post, gist → `raw/articles/`
- Academic paper, PDF → `raw/papers/`
- Talk transcript, interview, podcast → `raw/transcripts/`
- Image, dataset, diagram → `raw/assets/`

#### Step 2 — Add frontmatter

Every raw file needs:

```yaml
---
source_url: https://...
ingested: YYYY-MM-DD
sha256: <hex digest of the body>
---
```

**Auto-generate the sha256** (over the body, not the frontmatter):

```bash
# After you've written the body, compute its sha256
BODY_SHA=$(sha256sum raw/articles/my-article.md | awk '{print $1}')
# Manually edit the frontmatter to insert that value, OR use a script:
python3 -c "
import hashlib
with open('raw/articles/my-article.md','rb') as f:
    text = f.read()
# Split frontmatter (first '---\n...\n---\n') from body
fm, body = text.split(b'---\n', 1)[0], text.split(b'---\n', 1)[2].split(b'---\n', 1)[1]
print('sha256:', hashlib.sha256(body).hexdigest())
"
```

Then update the file's `sha256:` line with the printed value.

#### Step 3 — Tell the agent to process

Open your LLM CLI in the wiki directory:

```bash
cd ~/HadesWiki
codex "process raw/articles/my-article.md"   # or claude / opencode / hermes
```

The agent will:

1. Read `AGENT.md`, `schema.md`, `catalog.md`, and recent `log.md` (orientation)
2. Discuss the source with you
3. Write or update wiki pages (entities/concepts/comparisons)
4. Update `catalog.md`
5. Append to `log.md`
6. Report what changed

#### Step 4 — Verify

```bash
cd ~/HadesWiki
# What's new?
git status
git diff catalog.md log.md

# Lint check (see § 3.4)
# (run the lint script)
```

### 3.3 — Asking Questions

```bash
cd ~/HadesWiki
codex "according to the wiki, what is the difference between RAG and the LLM Wiki pattern?"
```

The agent will:

1. Orient
2. Read `catalog.md` → identify `rag-vs-llm-wiki` and `llm-wiki-pattern`
3. Read those pages
4. Synthesize an answer with citations
5. Optionally file the answer as a new `queries/<topic>.md` page

**Tips for good queries:**

- Be specific: "what does Karpathy say about Memex?" > "tell me about Memex"
- Cite the angle: "from a maintenance-cost perspective" > "explain"
- Ask for synthesis: "compare these three patterns" → may get filed as a `comparisons/` page

### 3.4 — Lint & Maintenance

#### Manual lint (any time)

```bash
cd ~/HadesWiki
python3 -c "
import os, re, hashlib, glob
from collections import defaultdict

WIKI = '.'
pages = [p for p in glob.glob(f'{WIKI}/**/*.md', recursive=True)
         if not p.startswith(f'{WIKI}/raw/')]

def parse_fm(text):
    if text.startswith('---\n'):
        end = text.find('\n---\n', 4)
        if end >= 0: return text[4:end], text[end+5:]
    return '', text

def strip_code(text):
    text = re.sub(r'\`\`\`[\s\S]*?\`\`\`', '', text)
    text = re.sub(r'\`[^\`\n]*\`', '', text)
    return text

wl = re.compile(r'\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]')
page_names = {os.path.basename(p).replace('.md','').lower() for p in pages}
page_names |= {p.split('/',1)[1].replace('.md','').lower() for p in pages if '/' in p}
page_names.add('karpathy-llm-wiki')

issues = 0
for p in pages:
    text = open(p).read()
    _, body = parse_fm(text)
    scan = strip_code(body)
    for m in wl.finditer(scan):
        if m.group(1).strip().lower() not in page_names:
            print(f'BROKEN: {p} -> [[{m.group(1)}]]'); issues += 1

print(f'{len(pages)} pages scanned, {issues} broken wikilinks')
"
```

#### Lint via the agent

```bash
codex "lint the wiki"
```

The agent will run the full 10-check lint and report findings grouped by
severity (Critical / Warning / Notice).

#### When to lint

- After every ingest (especially the first few as you learn the conventions)
- After editing more than 5 pages manually
- Before opening a PR
- Weekly as routine maintenance

### 3.5 — Editing Pages Manually

You can edit any wiki page by hand. Convention reminders:

- **Filenames:** lowercase, hyphens, no spaces
- **Frontmatter:** required for every wiki page (except `catalog.md`, `log.md`)
- **Tags:** must come from the taxonomy in `schema.md` — add new tags there first
- **Wikilinks:** `[[page-name]]` — case-insensitive match to filename
- **Provenance:** `^[raw/articles/source.md]` at end of synthesized paragraphs

After editing:

```bash
cd ~/HadesWiki
# Validate
codex "I edited X.md and Y.md — does anything else need updating?"

# Or commit directly
git add entities/karpathy.md
git commit -m "fix: correct Karpathy affiliation dates"
git push
```

---

## Part 4: Workflows by Role

### Reader

```
Browse → catalog.md → click page → read → follow wikilinks → graph view
```

Time investment: 5 minutes to learn Obsidian basics. Hours of exploration
after that.

### Curator

```
Find source (web/paper/podcast)
        ↓
Save to raw/ + add frontmatter + sha256
        ↓
Tell agent "process raw/..."
        ↓
Review what agent wrote (skim pages, check links)
        ↓
Tell agent what to fix or expand
        ↓
Commit + push
```

Time per source: 10–30 minutes depending on length and importance.

### Operator (LLM Agent)

```
Session starts
        ↓
ORIENT: read AGENT.md, schema.md, catalog.md, log tail
        ↓
Wait for user instruction: ingest / query / lint / edit
        ↓
Execute operation following the workflow in AGENT.md
        ↓
Report what changed
        ↓
Idle until next instruction
```

### Contributor (PR-based)

```
Fork repo on GitHub
        ↓
Clone your fork
        ↓
Make changes (add pages, fix typos, expand concepts)
        ↓
Run lint
        ↓
Commit + push to your fork
        ↓
Open PR against podsni/HadesWiki:main
        ↓
CI runs lint (if configured)
        ↓
Reviewer merges
```

---

## Part 5: Troubleshooting

### `[[wikilinks]]` show as plain text in GitHub

**Expected.** GitHub doesn't render Obsidian wikilinks. Solutions:

- Open in Obsidian
- Use a static-site generator (see § 1.6 Option C)
- Search the repo: `grep -rn '\[\[' entities/ concepts/`

### Agent doesn't auto-load `AGENT.md`

**Fix:** explicitly load it:

```bash
# Codex
codex --instructions "$(cat AGENT.md)" "..."

# Claude Code  
claude --system-prompt-file AGENT.md "..."

# OpenCode
opencode --append-system-prompt "$(cat AGENT.md)" "..."
```

### sha256 mismatch on re-ingest

**Meaning:** the source changed since you first captured it. Two paths:

1. **Intentional update:** re-ingest, update affected wiki pages
2. **Unintended drift:** investigate why (typo? corruption?) before replacing

### `git push` rejected (non-fast-forward)

Someone pushed to the same branch. Fix:

```bash
git pull --rebase
git push
```

### Obsidian graph view is empty / sparse

- Wait 5–10 seconds — graph view takes a moment to compute
- Check Settings → Graph View → Filters — make sure "Orphans" is enabled if you want to see lonely pages
- The wiki must be opened **as a vault**, not just a folder

### `qmd` fails to find anything

Run `qmd index` first to build the search index. Re-run after any new file.

### LLM agent hallucinates a page that doesn't exist

The wiki's lint catches this — broken wikilinks. If you see one:

```bash
cd ~/HadesWiki
# Find all broken links
grep -rn '\[\[nonexistent\]\]' .
```

Tell the agent to fix them: `codex "fix the broken wikilinks"` — it will either
correct the typo or create the missing page (if it should exist).

### Wiki grew past 500 log entries

Rotate the log:

```bash
cd ~/HadesWiki
mv log.md log-2026.md
# Edit log.md to start fresh with a pointer to log-2026.md:
echo "# Log" > log.md
echo "" >> log.md
echo "> Historical entries: log-2026.md" >> log.md
echo "" >> log.md
echo "## [$(date +%Y-%m-%d)] maintenance | log rotation" >> log.md
echo "- Moved previous entries to log-2026.md" >> log.md
git add log.md log-2026.md
git commit -m "log: rotate (now 2026 archive)"
git push
```

### Obsidian crashes on opening

**Likely:** malformed frontmatter in a recent file. Check the last-edited file:

```bash
# Find recently modified markdown files
find . -name "*.md" -mmin -60 -not -path "./raw/*"
```

Validate YAML frontmatter at https://www.yamllint.com/ or with python:

```bash
python3 -c "
import yaml
with open('concepts/your-page.md') as f:
    text = f.read()
fm = text.split('---\n', 2)[1]
print(yaml.safe_load(fm))
"
```

---

## Part 6: Reference

### File inventory

| File / Directory | Purpose | Owner | Mutable |
|---|---|---|---|
| `README.md` | Human-facing overview | Human | ✅ |
| `AGENT.md` | LLM agent operational playbook | Co-evolved | ✅ |
| `schema.md` | Conventions, taxonomy, thresholds | Co-evolved | ✅ |
| `catalog.md` | Content catalog | Agent | ✅ |
| `log.md` | Chronological action log | Agent | ✅ (append) |
| `.gitignore` | Local-only exclusions | Human | ✅ |
| `raw/articles/` | Web articles, gists | Human | ❌ (immutable) |
| `raw/papers/` | Academic PDFs | Human | ❌ |
| `raw/transcripts/` | Talks, podcasts | Human | ❌ |
| `raw/assets/` | Images, datasets | Human | ❌ |
| `entities/` | One page per entity | Agent | ✅ |
| `concepts/` | One page per topic | Agent | ✅ |
| `comparisons/` | Side-by-side analyses | Agent | ✅ |
| `queries/` | Filed query answers | Agent | ✅ |
| `GUIDE.md` | This file | Human | ✅ |

### Quick command reference

```bash
# Clone
git clone https://github.com/podsni/HadesWiki.git ~/HadesWiki

# Update
cd ~/HadesWiki && git pull

# Capture a source
curl -sSL https://example.com/article > raw/articles/article.md
# + add frontmatter with source_url, ingested, sha256

# Process via agent
cd ~/HadesWiki && codex "process raw/articles/article.md"

# Query
cd ~/HadesWiki && codex "according to the wiki, ..."

# Lint
cd ~/HadesWiki && codex "lint the wiki"

# Commit + push
cd ~/HadesWiki
git add -A
git commit -m "ingest: <source title>"
git push

# Rotate log when > 500 entries
mv log.md log-$(date +%Y).md   # see § 5 for full procedure

# Open in Obsidian
open -a Obsidian ~/HadesWiki      # macOS
obsidian ~/HadesWiki             # Linux (if installed via .deb)
```

### Environment variables (none required)

HadesWiki has no required env vars. Optional, only if you integrate with other
tools:

```bash
# For LLM CLIs that read OpenAI-compatible APIs
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...

# For gh CLI to push to GitHub
gh auth login
```

### Versioning

The wiki follows SemVer in spirit but doesn't tag releases — every commit to
`main` is the latest version. To pin to a snapshot:

```bash
cd ~/HadesWiki
git checkout <commit-sha>   # exact version
git checkout main           # return to latest
```

### License

Wiki content: MIT. Raw sources retain their original licenses — see each
`raw/` file for attribution and license.

---

## See Also

- **[Home page](home.md)** — short overview
- **[AGENT.md](AGENT.md)** — LLM agent playbook
- **[schema.md](./schema.md)** — full conventions
- **[catalog.md](catalog.md)** — content catalog
- **[log.md](./log.md)** — activity timeline
- **GitHub:** https://github.com/podsni/HadesWiki

---

*Last updated: 2026-06-12 · aligned with commit `262579a`*