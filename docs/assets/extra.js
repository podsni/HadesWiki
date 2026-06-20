// HadesWiki interactive enhancements

(function() {
  'use strict';

  // === 1. Keyboard shortcut: "/" focuses search (mkdocs-material already does this,
  //    but we add "/" only when not in input field) ===

  document.addEventListener('keydown', function(e) {
    if (e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) &&
        !document.activeElement.isContentEditable) {
      e.preventDefault();
      const searchInput = document.querySelector('.md-search__input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    // Esc to blur search
    if (e.key === 'Escape') {
      const searchInput = document.querySelector('.md-search__input');
      if (document.activeElement === searchInput) {
        searchInput.blur();
      }
    }
  });

  // === 2. Inject backlinks panel on every page that has incoming links ===
  // The wikilinks plugin exposes wikilinks_backlinks in the template,
  // but mkdocs-material doesn't render it automatically.
  // We add it via JS by reading data attributes injected by the plugin.
  // (Future enhancement: server-side injection via template override.)

  // === 3. Enhance Mermaid diagrams with pan/zoom if needed ===
  // mkdocs-material already renders Mermaid; we add a "click to fullscreen" hint.
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.mermaid').forEach(function(diagram) {
      diagram.setAttribute('title', 'Click to view fullscreen');
      diagram.style.cursor = 'zoom-in';
      diagram.addEventListener('click', function() {
        if (diagram.requestFullscreen) {
          diagram.requestFullscreen();
        }
      });
    });
  });

  // === 4. Show "last updated" indicator on hover ===
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('article time, [datetime]').forEach(function(el) {
      const dt = el.getAttribute('datetime') || el.getAttribute('title');
      if (dt) {
        el.setAttribute('title', dt);
      }
    });
  });

  // === 5. Add copy buttons to code blocks that don't already have one ===
  // mkdocs-material provides content.code.copy, so this is a no-op fallback.

  // === 6. Smooth scroll for anchor links ===
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href^="#"]');
    if (link && link.getAttribute('href').length > 1) {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', link.getAttribute('href'));
      }
    }
  });
})();