/* ============================================================================
   HadesWiki — Obsidian-like interactive layer
   - File tree sidebar (collapsible folders)
   - Sidebar search filter
   - Hover preview popup on wikilinks
   - Page metadata header (tags + backlinks count)
   - Outgoing links panel
   - Per-page local graph (SVG)
   - Keyboard shortcuts
   - Theme-aware (light/dark)
   ============================================================================ */

(function() {
  'use strict';

  const TREE_URL = (function() {
    const p = window.location.pathname;
    // If running under /HadesWiki/ prefix (GitHub Pages), assets live there
    if (p.indexOf('/HadesWiki/') === 0) return '/HadesWiki/assets/wiki-tree.json';
    return '/assets/wiki-tree.json';
  })();
  const GRAPHS_URL = (function() {
    const p = window.location.pathname;
    if (p.indexOf('/HadesWiki/') === 0) return '/HadesWiki/assets/local-graphs.json';
    return '/assets/local-graphs.json';
  })();
  // Detect site base from current URL path (production is /HadesWiki/, local is /)
  function getSiteBase() {
    const p = window.location.pathname;
    if (p.indexOf('/HadesWiki/') === 0) return '/HadesWiki/';
    return '/';
  }
  const SITE_BASE = getSiteBase();

  // === Detect current page slug from URL ===
  function currentPageSlug() {
    let p = window.location.pathname;
    if (p.indexOf('/HadesWiki/') === 0) p = p.slice('/HadesWiki'.length);
    if (p.startsWith('/')) p = p.slice(1);
    if (p.endsWith('/')) p = p.slice(0, -1);
    return p.toLowerCase();
  }

  // === Cache loaded data ===
  let WIKI_DATA = null;
  let LOCAL_GRAPHS = null;

  async function loadTree() {
    if (WIKI_DATA) return WIKI_DATA;
    try {
      const r = await fetch(TREE_URL);
      WIKI_DATA = await r.json();
      window.__HW_TREE_DATA = WIKI_DATA;  // expose for sort backlook
      return WIKI_DATA;
    } catch (e) {
      console.warn('Failed to load wiki tree:', e);
      return { tree: { children: [] }, pages: [], meta_section: [] };
    }
  }

  async function loadLocalGraphs() {
    if (LOCAL_GRAPHS) return LOCAL_GRAPHS;
    try {
      const r = await fetch(GRAPHS_URL);
      LOCAL_GRAPHS = await r.json();
      return LOCAL_GRAPHS;
    } catch (e) {
      console.warn('Failed to load local graphs:', e);
      return {};
    }
  }

  // ============================================================================
  // 1. FILE TREE SIDEBAR (Obsidian-style)
  // ============================================================================

  // localStorage keys
  const LS_COLLAPSE = 'hw_sidebar_collapse';
  const LS_SORT = 'hw_sidebar_sort';
  const LS_META_OPEN = 'hw_sidebar_meta_open';

  function getCollapseState() {
    try {
      return JSON.parse(localStorage.getItem(LS_COLLAPSE) || '{}');
    } catch (e) {
      return {};
    }
  }

  function setCollapseState(state) {
    try {
      localStorage.setItem(LS_COLLAPSE, JSON.stringify(state));
    } catch (e) {}
  }

  function getSortMode() {
    try {
      return localStorage.getItem(LS_SORT) || 'name-asc';
    } catch (e) {
      return 'name-asc';
    }
  }

  function setSortMode(mode) {
    try {
      localStorage.setItem(LS_SORT, mode);
    } catch (e) {}
  }

  async function renderSidebar() {
    const data = await loadTree();
    const sidebar = document.createElement('aside');
    sidebar.className = 'hw-sidebar';
    sidebar.id = 'hw-sidebar';

    // --- Vault header (sticky) ---
    const vault = document.createElement('div');
    vault.className = 'hw-sidebar-vault';
    vault.innerHTML = `
      <span class="hw-sidebar-vault-name">HadesWiki</span>
      <div class="hw-sidebar-vault-actions">
        <button class="hw-sidebar-icon-btn" id="hw-toggle-meta" title="Toggle meta pages">📑</button>
      </div>
    `;
    sidebar.appendChild(vault);

    // --- Search ---
    const searchWrap = document.createElement('div');
    searchWrap.className = 'hw-sidebar-search-wrap';
    searchWrap.innerHTML = `<input type="text" class="hw-sidebar-search" placeholder="Filter pages..." id="hw-sidebar-search" />`;
    sidebar.appendChild(searchWrap);

    // --- Tools row (sort + collapse all) ---
    const tools = document.createElement('div');
    tools.className = 'hw-sidebar-tools';
    tools.innerHTML = `
      <button class="hw-sidebar-sort" id="hw-sort-btn" title="Change sort order">
        <span id="hw-sort-label">↑ A→Z</span>
      </button>
      <button class="hw-sidebar-collapse-all" id="hw-collapse-all" title="Expand / collapse all">
        <span id="hw-collapse-icon">⊟</span>
      </button>
    `;
    sidebar.appendChild(tools);

    // --- Tree container ---
    const treeContainer = document.createElement('div');
    treeContainer.className = 'hw-tree';
    treeContainer.id = 'hw-tree';
    sidebar.appendChild(treeContainer);

    // --- Toggle button (hamburger) ---
    const toggle = document.createElement('button');
    toggle.className = 'hw-sidebar-toggle';
    toggle.id = 'hw-sidebar-toggle';
    toggle.title = 'Toggle sidebar (B)';
    toggle.innerHTML = '☰';

    document.body.appendChild(sidebar);
    document.body.appendChild(toggle);
    document.body.classList.add('hw-sidebar-visible');

    // --- Render content tree ---
    renderContentTree(data.tree, treeContainer);

    // --- Render meta section (initially hidden if collapsed) ---
    renderMetaSection(data.meta_section, treeContainer);

    // --- Filter wiring ---
    const searchInput = document.getElementById('hw-sidebar-search');
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      filterTree(treeContainer, q);
    });

    // --- Highlight active file + auto-expand its folder ---
    const current = currentPageSlug();
    if (current) {
      const active = treeContainer.querySelector(`.hw-tree-file[data-slug="${CSS.escape(current)}"]`);
      if (active) {
        active.classList.add('active');
        // Expand parent folders (using collapse-state or auto-expand on active)
        let parent = active.closest('.hw-tree-folder');
        while (parent) {
          parent.classList.add('open');
          parent = parent.parentElement?.closest('.hw-tree-folder');
        }
      }
    }

    // --- Toggle sidebar ---
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      document.body.classList.toggle('hw-sidebar-visible');
    });

    // --- Sort dropdown cycle ---
    const sortBtn = document.getElementById('hw-sort-btn');
    const sortLabel = document.getElementById('hw-sort-label');
    const SORT_MODES = [
      { id: 'name-asc', label: '↑ A→Z' },
      { id: 'name-desc', label: '↓ Z→A' },
      { id: 'backlinks', label: '⬆ Backlinks' },
    ];
    function updateSortLabel() {
      const mode = getSortMode();
      const found = SORT_MODES.find(m => m.id === mode) || SORT_MODES[0];
      sortLabel.textContent = found.label;
    }
    updateSortLabel();
    sortBtn.addEventListener('click', () => {
      const cur = getSortMode();
      const idx = SORT_MODES.findIndex(m => m.id === cur);
      const next = SORT_MODES[(idx + 1) % SORT_MODES.length];
      setSortMode(next.id);
      updateSortLabel();
      applySort(treeContainer, next.id, data);
    });

    // --- Collapse/Expand all toggle ---
    const collapseBtn = document.getElementById('hw-collapse-all');
    const collapseIcon = document.getElementById('hw-collapse-icon');
    function updateCollapseIcon() {
      const folders = treeContainer.querySelectorAll('.hw-tree-folder');
      const openCount = treeContainer.querySelectorAll('.hw-tree-folder.open').length;
      collapseIcon.textContent = (folders.length > 0 && openCount === folders.length) ? '⊞' : '⊟';
    }
    collapseBtn.addEventListener('click', () => {
      const folders = treeContainer.querySelectorAll('.hw-tree-folder');
      const openCount = treeContainer.querySelectorAll('.hw-tree-folder.open').length;
      const expandAll = openCount < folders.length;
      const state = getCollapseState();
      folders.forEach(f => {
        const key = folderKey(f);
        if (expandAll) {
          f.classList.add('open');
          if (key) state[key] = true;
        } else {
          f.classList.remove('open');
          if (key) state[key] = false;
        }
      });
      setCollapseState(state);
      updateCollapseIcon();
    });

    // --- Toggle meta section ---
    const metaToggleBtn = document.getElementById('hw-toggle-meta');
    function updateMetaVisibility() {
      const metaWrap = document.getElementById('hw-meta-section-wrap');
      if (!metaWrap) return;
      const isOpen = localStorage.getItem(LS_META_OPEN) === '1';
      metaWrap.style.display = isOpen ? '' : 'none';
      metaToggleBtn.style.opacity = isOpen ? '1' : '0.5';
      metaToggleBtn.title = isOpen ? 'Hide meta pages' : 'Show meta pages';
    }
    metaToggleBtn.addEventListener('click', () => {
      const cur = localStorage.getItem(LS_META_OPEN) === '1';
      localStorage.setItem(LS_META_OPEN, cur ? '0' : '1');
      updateMetaVisibility();
    });
    updateMetaVisibility();
    updateCollapseIcon();

    // --- Apply persisted collapse state to folders ---
    const state = getCollapseState();
    treeContainer.querySelectorAll('.hw-tree-folder').forEach(f => {
      const key = folderKey(f);
      if (key && state[key] === false) {
        f.classList.remove('open');
      } else if (key) {
        f.classList.add('open');
      }
    });
    updateCollapseIcon();

    // --- Apply sort to current view ---
    applySort(treeContainer, getSortMode(), data);
  }

  // Build a stable key for a folder based on its DOM path
  function folderKey(folderEl) {
    const parts = [];
    let el = folderEl;
    while (el && el !== document) {
      if (el.classList && el.classList.contains('hw-tree-folder')) {
        const nameEl = el.querySelector(':scope > .hw-tree-folder-label > .hw-tree-folder-name');
        if (nameEl) parts.unshift(nameEl.textContent.trim());
      }
      el = el.parentElement;
    }
    return parts.join('/') || null;
  }

  // Sort the rendered tree by a given mode
  function applySort(container, mode, data) {
    if (mode === 'name-asc' || mode === 'name-desc') {
      // Sort children in each folder
      container.querySelectorAll('.hw-tree-folder-children').forEach(c => {
        const items = Array.from(c.children);
        items.sort((a, b) => {
          // folders first, then files (Obsidian default), both alphabetically
          const aIsFolder = a.classList.contains('hw-tree-folder');
          const bIsFolder = b.classList.contains('hw-tree-folder');
          if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
          const an = a.querySelector('.hw-tree-folder-name, .hw-tree-file-name')?.textContent || '';
          const bn = b.querySelector('.hw-tree-folder-name, .hw-tree-file-name')?.textContent || '';
          const cmp = an.localeCompare(bn);
          return mode === 'name-asc' ? cmp : -cmp;
        });
        items.forEach(it => c.appendChild(it));
      });
    } else if (mode === 'backlinks') {
      // Sort files by backlink count (descending), folders by max child backlinks
      const getBacklinks = (slug) => {
        const page = data.pages.find(p => p.slug === slug);
        return page ? (page.backlinks_count || 0) : 0;
      };
      container.querySelectorAll('.hw-tree-folder-children').forEach(c => {
        const items = Array.from(c.children);
        items.sort((a, b) => {
          if (a.classList.contains('hw-tree-folder') && b.classList.contains('hw-tree-folder')) {
            const aSlug = a.dataset.slug || '';
            const bSlug = b.dataset.slug || '';
            // Compare max backlink count within each folder
            const aMax = maxBacklinksInFolder(a, getBacklinks);
            const bMax = maxBacklinksInFolder(b, getBacklinks);
            return bMax - aMax;
          }
          if (a.classList.contains('hw-tree-folder')) return -1;
          if (b.classList.contains('hw-tree-folder')) return 1;
          const an = parseInt(a.dataset.backlinks || '0', 10);
          const bn = parseInt(b.dataset.backlinks || '0', 10);
          return bn - an;
        });
        items.forEach(it => c.appendChild(it));
      });
    }
  }

  function maxBacklinksInFolder(folderEl, getBacklinks) {
    let max = 0;
    folderEl.querySelectorAll('.hw-tree-file').forEach(f => {
      const c = getBacklinks(f.dataset.slug);
      if (c > max) max = c;
    });
    return max;
  }

  // Render content tree (only show_in_tree pages)
  function renderContentTree(node, container) {
    if (!node.children || node.children.length === 0) return;

    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'hw-section-header';
    sectionHeader.innerHTML = `<span>📝 Notes</span><button class="hw-section-header-toggle" title="Section actions">⋮</button>`;
    container.appendChild(sectionHeader);

    const folderRoot = document.createElement('div');
    folderRoot.className = 'hw-tree-root';
    container.appendChild(folderRoot);

    renderNodeInto(node, folderRoot, true);
  }

  function renderNodeInto(node, container, isRoot = false) {
    if (!node.children) return;
    for (const child of node.children) {
      if (child.type === 'folder') {
        const folderEl = document.createElement('div');
        folderEl.className = 'hw-tree-folder open'; // default open
        folderEl.dataset.slug = child.name;

        const label = document.createElement('div');
        label.className = 'hw-tree-folder-label';
        const titleCase = child.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        label.innerHTML = `
          <span class="hw-tree-folder-chevron">▸</span>
          <span class="hw-tree-folder-icon">📁</span>
          <span class="hw-tree-folder-name">${escapeHtml(titleCase)}</span>
          <span class="hw-tree-folder-count">${child.file_count || 0}</span>
        `;
        label.addEventListener('click', () => {
          folderEl.classList.toggle('open');
          // Persist
          const state = getCollapseState();
          const key = folderKey(folderEl);
          if (key) {
            state[key] = folderEl.classList.contains('open');
            setCollapseState(state);
          }
        });
        folderEl.appendChild(label);

        const childContainer = document.createElement('div');
        childContainer.className = 'hw-tree-folder-children';
        folderEl.appendChild(childContainer);
        container.appendChild(folderEl);
        renderNodeInto(child, childContainer);
      } else {
        const fileEl = document.createElement('a');
        fileEl.className = 'hw-tree-file';
        fileEl.href = child.url;
        fileEl.dataset.slug = child.slug;
        fileEl.dataset.searchText = ((child.title || child.name) + ' ' + (child.tags || []).join(' ')).toLowerCase();
        // Look up backlink count from data
        const page = window.__HW_TREE_DATA && window.__HW_TREE_DATA.pages.find(p => p.slug === child.slug);
        if (page) fileEl.dataset.backlinks = page.backlinks_count || 0;
        fileEl.innerHTML = `
          <span class="hw-tree-file-icon">${child.icon || '📄'}</span>
          <span class="hw-tree-file-name">${escapeHtml(child.title || child.name)}</span>
        `;
        container.appendChild(fileEl);
      }
    }
  }

  // Render meta section (collapsible, hidden by default)
  function renderMetaSection(metaPages, container) {
    if (!metaPages || metaPages.length === 0) return;

    const sectionWrap = document.createElement('div');
    sectionWrap.id = 'hw-meta-section-wrap';

    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'hw-section-header';
    sectionHeader.innerHTML = `<span>📑 Meta</span><button class="hw-section-header-toggle" title="Section actions">⋮</button>`;
    sectionWrap.appendChild(sectionHeader);

    const section = document.createElement('div');
    section.id = 'hw-meta-section';
    section.className = 'hw-meta-section';
    section.style.display = 'none'; // hidden by default

    if (metaPages.length === 0) {
      section.innerHTML = '<div class="hw-tree-empty">No meta pages</div>';
    } else {
      for (const p of metaPages) {
        const fileEl = document.createElement('a');
        fileEl.className = 'hw-tree-file hw-meta-file';
        fileEl.href = p.url;
        fileEl.dataset.slug = p.slug;
        fileEl.dataset.searchText = (p.title + ' ' + (p.tags || []).join(' ')).toLowerCase();
        fileEl.innerHTML = `
          <span class="hw-tree-file-icon">${p.icon || '📄'}</span>
          <span class="hw-tree-file-name">${escapeHtml(p.title)}</span>
        `;
        section.appendChild(fileEl);
      }
    }
    sectionWrap.appendChild(section);
    sectionWrap.style.display = 'none'; // wrapper hidden by default too
    container.appendChild(sectionWrap);
  }

  function filterTree(container, q) {
    if (!q) {
      container.querySelectorAll('.hw-tree-file, .hw-tree-folder').forEach(el => {
        el.style.display = '';
      });
      // Re-expand all folders when clearing filter
      container.querySelectorAll('.hw-tree-folder').forEach(f => {
        f.classList.add('open');
      });
      // Restore meta visibility to its persisted state
      const metaWrap = document.getElementById('hw-meta-section-wrap');
      if (metaWrap) {
        metaWrap.style.display = (localStorage.getItem(LS_META_OPEN) === '1') ? '' : 'none';
      }
      return;
    }
    // Hide files that don't match
    container.querySelectorAll('.hw-tree-file').forEach(el => {
      const matches = el.dataset.searchText && el.dataset.searchText.includes(q);
      el.style.display = matches ? '' : 'none';
    });
    // For each folder, check if any child matches; hide if not; expand if matches
    container.querySelectorAll('.hw-tree-folder').forEach(f => {
      const hasMatch = !!f.querySelector('.hw-tree-file:not([style*="display: none"])');
      f.style.display = hasMatch ? '' : 'none';
      if (hasMatch) f.classList.add('open');
    });
    // Also check meta section
    const metaSec = document.getElementById('hw-meta-section');
    const metaWrap = document.getElementById('hw-meta-section-wrap');
    if (metaSec && metaWrap) {
      let metaHasMatch = false;
      metaSec.querySelectorAll('.hw-tree-file').forEach(el => {
        const matches = el.dataset.searchText && el.dataset.searchText.includes(q);
        el.style.display = matches ? '' : 'none';
        if (matches) metaHasMatch = true;
      });
      // Auto-show wrapper when filter has matches (regardless of LS_META_OPEN)
      metaWrap.style.display = (metaHasMatch || localStorage.getItem(LS_META_OPEN) === '1') ? '' : 'none';
    }
  }

  // ============================================================================
  // 2. HOVER PREVIEW POPUP
  // ============================================================================
  let HOVER_POPUP = null;
  let HOVER_TIMEOUT = null;
  let LAST_HOVER_TARGET = null;

  async function setupHoverPreviews() {
    if (!HOVER_POPUP) {
      HOVER_POPUP = document.createElement('div');
      HOVER_POPUP.id = 'hw-hover-preview';
      document.body.appendChild(HOVER_POPUP);
    }

    // Listen on all internal content links
    document.addEventListener('mouseover', async (e) => {
      const link = e.target.closest('.md-content a[href]');
      if (!link || !isInternalLink(link)) return;

      // Skip if already showing this one
      if (LAST_HOVER_TARGET === link) return;
      LAST_HOVER_TARGET = link;

      clearTimeout(HOVER_TIMEOUT);
      HOVER_TIMEOUT = setTimeout(async () => {
        await showPreview(link);
      }, 250);
    });

    document.addEventListener('mouseout', (e) => {
      const link = e.target.closest('.md-content a[href]');
      if (!link) return;
      if (e.relatedTarget && link.contains(e.relatedTarget)) return;
      clearTimeout(HOVER_TIMEOUT);
      HOVER_TIMEOUT = setTimeout(hidePreview, 200);
    });

    HOVER_POPUP.addEventListener('mouseenter', () => {
      clearTimeout(HOVER_TIMEOUT);
    });
    HOVER_POPUP.addEventListener('mouseleave', hidePreview);
  }

  function isInternalLink(link) {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('http://') || href.startsWith('https://')) return false;
    if (href.startsWith('#')) return false; // anchor only
    if (href.startsWith('mailto:')) return false;
    return true;
  }

  function urlToSlug(href) {
    try {
      // Resolve relative URL against current page
      const u = new URL(href, window.location.href);
      let p = u.pathname;
      if (p.indexOf('/HadesWiki/') === 0) p = p.slice('/HadesWiki'.length);
      if (p.startsWith('/')) p = p.slice(1);
      if (p.endsWith('/')) p = p.slice(0, -1);
      return p.toLowerCase();
    } catch (e) {
      return null;
    }
  }

  async function showPreview(link) {
    const data = await loadTree();
    const slug = urlToSlug(link.getAttribute('href'));
    if (!slug) return;
    const page = data.pages.find(p => p.slug === slug || p.slug === 'index' && slug === '');
    if (!page) {
      hidePreview();
      return;
    }

    // Fetch the actual page to extract excerpt
    let excerpt = '';
    try {
      const fullUrl = new URL(page.url, window.location.origin).href;
      const r = await fetch(fullUrl);
      const html = await r.text();
      // Strip tags, take first ~400 chars
      const text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                       .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                       .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
                       .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
                       .replace(/<[^>]+>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim();
      excerpt = text.slice(0, 400);
      if (text.length > 400) excerpt += '...';
    } catch (e) {
      excerpt = 'Preview unavailable.';
    }

    HOVER_POPUP.innerHTML = `
      <div class="hw-preview-title">${escapeHtml(page.title)}</div>
      <div class="hw-preview-tags">${(page.tags || []).slice(0, 5).map(t => `<span class="hw-tag">${escapeHtml(t)}</span>`).join('')}</div>
      <div class="hw-preview-excerpt">${escapeHtml(excerpt)}</div>
      <a class="hw-preview-link" href="${page.url}">Open page →</a>
    `;

    // Position near link
    const rect = link.getBoundingClientRect();
    const popupRect = HOVER_POPUP.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - 240; // center on link
    let top = rect.bottom + 8;

    // Clamp to viewport
    if (left + 480 > window.innerWidth) left = window.innerWidth - 490;
    if (left < 10) left = 10;
    if (top + 320 > window.innerHeight) top = rect.top - 320;

    HOVER_POPUP.style.left = left + 'px';
    HOVER_POPUP.style.top = top + 'px';
    HOVER_POPUP.classList.add('visible');
  }

  function hidePreview() {
    if (HOVER_POPUP) HOVER_POPUP.classList.remove('visible');
    LAST_HOVER_TARGET = null;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ============================================================================
  // 3. PAGE METADATA HEADER + OUTGOING LINKS PANEL
  // ============================================================================
  async function enhancePageContent() {
    const data = await loadTree();
    const slug = currentPageSlug();
    if (!slug) return;
    const page = data.pages.find(p => p.slug === slug);
    if (!page) return;

    const content = document.querySelector('.md-content__inner');
    if (!content) return;

    // === Metadata header (inserted after H1) ===
    const h1 = content.querySelector('h1');
    if (h1 && !document.getElementById('hw-page-meta')) {
      const meta = document.createElement('div');
      meta.id = 'hw-page-meta';
      meta.className = 'hw-page-meta';
      let html = '';
      if (page.tags && page.tags.length) {
        html += `<div class="hw-page-meta-row"><span class="hw-page-meta-label">Tags</span>${page.tags.map(t => `<span class="hw-tag">${escapeHtml(t)}</span>`).join('')}</div>`;
      }
      html += `<div class="hw-page-meta-row"><span class="hw-page-meta-label">Backlinks</span><span>${page.backlinks_count}</span></div>`;
      html += `<div class="hw-page-meta-row"><span class="hw-page-meta-label">Outgoing</span><span>${(page.outgoing || []).length}</span></div>`;
      html += `<div class="hw-page-meta-row"><span class="hw-page-meta-label">Path</span><span style="font-family:var(--hw-font-mono);font-size:0.85em;">${escapeHtml(page.path)}</span></div>`;
      meta.innerHTML = html;
      h1.insertAdjacentElement('afterend', meta);
    }

    // === Outgoing links panel (inserted before backlinks) ===
    const backlinks = document.querySelector('.wikilinks-backlinks');
    if (backlinks && page.outgoing && page.outgoing.length && !document.getElementById('hw-outgoing')) {
      const outgoing = document.createElement('aside');
      outgoing.id = 'hw-outgoing';
      outgoing.className = 'hw-outgoing';
      outgoing.innerHTML = `<h3>↗ Outgoing links (${page.outgoing.length})</h3><ul></ul>`;
      const ul = outgoing.querySelector('ul');
      // Resolve outgoing slugs to page titles
      const resolved = page.outgoing.map(target => {
        const targetPage = data.pages.find(p => p.slug.toLowerCase() === target || p.slug.split('/').pop().toLowerCase() === target);
        return targetPage ? { title: targetPage.title, url: targetPage.url } : { title: target, url: null };
      });
      resolved.forEach(r => {
        const li = document.createElement('li');
        if (r.url) {
          li.innerHTML = `<a href="${r.url}">${escapeHtml(r.title)}</a>`;
        } else {
          li.innerHTML = `<span style="color:#9ca3af;text-decoration:line-through;">${escapeHtml(r.title)}</span>`;
        }
        ul.appendChild(li);
      });
      backlinks.insertAdjacentElement('beforebegin', outgoing);
    }
  }

  // ============================================================================
  // 4. LOCAL GRAPH (per-page subgraph)
  // ============================================================================
  async function renderLocalGraph() {
    const data = await loadTree();
    const graphs = await loadLocalGraphs();
    const slug = currentPageSlug();
    if (!slug || !graphs[slug]) return;

    const graph = graphs[slug];
    if (!graph.nodes.length) return;

    // Skip on graph page itself (it has the global graph)
    if (slug === 'graph') return;

    const container = document.createElement('aside');
    container.className = 'hw-local-graph';
    container.innerHTML = `
      <h3>🕸 Local graph — ${graph.nodes.length} nodes, ${graph.edges.length} edges</h3>
      <div class="hw-local-graph-container" id="hw-local-graph-svg"></div>
    `;

    // Insert before backlinks (if present) or at end of content
    const backlinks = document.querySelector('.wikilinks-backlinks');
    const content = document.querySelector('.md-content__inner');
    const target = backlinks || content;
    if (target) target.insertAdjacentElement('beforebegin', container);

    // Render simple force-directed-ish SVG (circular layout with main node in center)
    const svgEl = document.getElementById('hw-local-graph-svg');
    const W = svgEl.clientWidth || 600;
    const H = 280;
    const cx = W / 2, cy = H / 2;

    const mainNode = graph.nodes.find(n => n.main) || graph.nodes[0];
    const otherNodes = graph.nodes.filter(n => !n.main);

    // Layout: main in center, others in circle
    const positions = {};
    positions[mainNode.id] = { x: cx, y: cy, main: true };
    const r = Math.min(W, H) * 0.35;
    otherNodes.forEach((n, i) => {
      const angle = (i / otherNodes.length) * Math.PI * 2 - Math.PI / 2;
      positions[n.id] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        main: false,
      };
    });

    // Build SVG
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'background:transparent;';

    // Edges
    const edgesGroup = document.createElementNS(svgNS, 'g');
    graph.edges.forEach(e => {
      const from = positions[e.from];
      const to = positions[e.to];
      if (!from || !to) return;
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('stroke', '#8b5cf6');
      line.setAttribute('stroke-width', '1.2');
      line.setAttribute('opacity', '0.4');
      edgesGroup.appendChild(line);
    });
    svg.appendChild(edgesGroup);

    // Nodes
    const nodesGroup = document.createElementNS(svgNS, 'g');
    Object.entries(positions).forEach(([id, pos]) => {
      const node = graph.nodes.find(n => n.id === id);
      if (!node) return;

      const g = document.createElementNS(svgNS, 'g');
      g.style.cursor = node.main ? 'default' : 'pointer';

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', pos.main ? 14 : 9);
      circle.setAttribute('fill', pos.main ? '#8b5cf6' : '#a78bfa');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      if (!pos.main) {
        g.addEventListener('click', () => { window.location.href = node.url; });
      }
      g.appendChild(circle);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y + (pos.main ? 28 : 22));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', pos.main ? '12' : '10');
      text.setAttribute('font-weight', pos.main ? '700' : '500');
      text.setAttribute('fill', pos.main ? '#7c3aed' : '#6b7280');
      text.setAttribute('font-family', 'Inter, sans-serif');
      // Truncate label
      const label = node.title.length > 18 ? node.title.slice(0, 16) + '…' : node.title;
      text.textContent = label;
      g.appendChild(text);

      nodesGroup.appendChild(g);
    });
    svg.appendChild(nodesGroup);

    svgEl.appendChild(svg);
  }

  // ============================================================================
  // 5. GLOBAL GRAPH PAGE ENHANCEMENTS (force-directed, clickable)
  // ============================================================================
  async function enhanceGraphPage() {
    if (currentPageSlug() !== 'graph') return;

    // Find the Mermaid graph in the page and wrap it for fullscreen mode
    const mermaidDiv = document.querySelector('.mermaid');
    if (mermaidDiv) {
      const container = document.createElement('div');
      container.className = 'hw-graph-container';
      mermaidDiv.parentNode.insertBefore(container, mermaidDiv);
      container.appendChild(mermaidDiv);
    }

    // Add click-to-navigate on Mermaid nodes after render
    setTimeout(() => {
      const data = WIKI_DATA;
      if (!data) return;
      document.querySelectorAll('.mermaid .node').forEach(nodeEl => {
        const label = nodeEl.textContent.trim();
        // Match against page titles
        const match = data.pages.find(p => p.title.toLowerCase() === label.toLowerCase());
        if (match) {
          nodeEl.style.cursor = 'pointer';
          nodeEl.addEventListener('click', () => { window.location.href = match.url; });
        }
      });
    }, 1500);
  }

  // ============================================================================
  // 6. KEYBOARD SHORTCUTS
  // ============================================================================
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) ||
                      document.activeElement.isContentEditable;
      if (inInput) return;

      // "/" — focus search
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('.md-search__input');
        if (searchInput) { searchInput.focus(); searchInput.select(); }
      }
      // "b" — toggle sidebar
      else if (e.key === 'b' || e.key === 'B') {
        const sidebar = document.getElementById('hw-sidebar');
        if (sidebar) sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('hw-sidebar-visible');
      }
      // "g" then "g" — go home
      else if (e.key === 'g') {
        window.__hw_next = setTimeout(() => { window.__hw_next = null; }, 800);
        window.__hw_prev = 'g';
      }
      else if (e.key === 'h' && window.__hw_prev === 'g') {
        window.location.href = SITE_BASE + '/';
        window.__hw_prev = null;
      }
      // Escape — blur search / close preview
      else if (e.key === 'Escape') {
        const searchInput = document.querySelector('.md-search__input');
        if (document.activeElement === searchInput) searchInput.blur();
        hidePreview();
      }
    });
  }

  // ============================================================================
  // INIT
  // ============================================================================
  async function init() {
    // 1. Sidebar (must come first so layout shifts before content renders)
    await renderSidebar();
    // 2. Page enhancements
    await enhancePageContent();
    await renderLocalGraph();
    await enhanceGraphPage();
    // 3. Hover previews
    await setupHoverPreviews();
    // 4. Keyboard shortcuts
    setupKeyboardShortcuts();

    console.log('🟣 HadesWiki Obsidian-like UI initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();