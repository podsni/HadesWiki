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
      return WIKI_DATA;
    } catch (e) {
      console.warn('Failed to load wiki tree:', e);
      return { tree: { children: [] }, pages: [] };
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
  // 1. FILE TREE SIDEBAR
  // ============================================================================
  async function renderSidebar() {
    const data = await loadTree();
    const sidebar = document.createElement('aside');
    sidebar.className = 'hw-sidebar';
    sidebar.id = 'hw-sidebar';

    const header = document.createElement('div');
    header.className = 'hw-sidebar-header';
    header.innerHTML = `
      <div class="hw-sidebar-title">📚 HadesWiki</div>
      <input type="text" class="hw-sidebar-search" placeholder="Filter pages..." id="hw-sidebar-search" />
    `;
    sidebar.appendChild(header);

    const treeContainer = document.createElement('div');
    treeContainer.className = 'hw-tree';
    treeContainer.id = 'hw-tree';
    sidebar.appendChild(treeContainer);

    // Toggle button
    const toggle = document.createElement('button');
    toggle.className = 'hw-sidebar-toggle';
    toggle.id = 'hw-sidebar-toggle';
    toggle.title = 'Toggle sidebar (B)';
    toggle.innerHTML = '☰';

    // Insert as first child of body (after header)
    document.body.appendChild(sidebar);
    document.body.appendChild(toggle);
    document.body.classList.add('hw-sidebar-visible');

    // Render tree
    renderTreeNode(data.tree, treeContainer, true);

    // Filter functionality
    const searchInput = document.getElementById('hw-sidebar-search');
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      filterTree(treeContainer, q);
    });

    // Auto-expand folder of current page + highlight
    const current = currentPageSlug();
    if (current) {
      const active = treeContainer.querySelector(`.hw-tree-file[href$="${current}/"], .hw-tree-file[href$="${current}"]`);
      if (active) {
        active.classList.add('active');
        // Expand parent folders
        let parent = active.parentElement;
        while (parent && parent !== treeContainer) {
          if (parent.classList && parent.classList.contains('hw-tree-folder')) {
            parent.classList.add('open');
          }
          parent = parent.parentElement;
        }
      }
    }

    // Toggle button
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      document.body.classList.toggle('hw-sidebar-visible');
    });
  }

  function renderTreeNode(node, container, isRoot = false) {
    if (!node.children) return;
    const children = node.children;
    for (const child of children) {
      if (child.type === 'folder') {
        const folderEl = document.createElement('div');
        folderEl.className = 'hw-tree-folder';
        const label = document.createElement('div');
        label.className = 'hw-tree-folder-label';
        label.textContent = '📁 ' + child.name.replace(/-/g, ' ');
        label.addEventListener('click', () => {
          folderEl.classList.toggle('open');
        });
        folderEl.appendChild(label);
        const childContainer = document.createElement('div');
        childContainer.className = 'hw-tree-folder-children';
        folderEl.appendChild(childContainer);
        container.appendChild(folderEl);
        renderTreeNode(child, childContainer);
      } else {
        const fileEl = document.createElement('a');
        fileEl.className = 'hw-tree-file';
        fileEl.href = child.url;
        fileEl.textContent = child.title || child.name;
        fileEl.dataset.searchText = ((child.title || child.name) + ' ' + (child.tags || []).join(' ')).toLowerCase();
        container.appendChild(fileEl);
      }
    }
  }

  function filterTree(container, q) {
    if (!q) {
      // Show all, restore open state
      container.querySelectorAll('.hw-tree-file').forEach(el => el.style.display = '');
      return;
    }
    container.querySelectorAll('.hw-tree-file').forEach(el => {
      const matches = el.dataset.searchText.includes(q);
      el.style.display = matches ? '' : 'none';
    });
    // Auto-expand all folders with matches
    container.querySelectorAll('.hw-tree-folder').forEach(f => {
      const hasMatch = f.querySelector('.hw-tree-file:not([style*="display: none"])');
      if (hasMatch) f.classList.add('open');
    });
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