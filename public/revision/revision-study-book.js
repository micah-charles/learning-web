(function () {
  'use strict';

  var input = document.getElementById('sb-search-input');
  var content = document.getElementById('sb-content');
  var countEl = document.getElementById('sb-search-count');
  var prevBtn = document.getElementById('sb-search-prev');
  var nextBtn = document.getElementById('sb-search-next');
  var matches = [];
  var currentMatch = -1;

  function clearHighlights() {
    matches.forEach(function (m) { m.classList.remove('sb-highlight-active'); });
    var marks = content.querySelectorAll('mark.sb-highlight');
    marks.forEach(function (mark) {
      var parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
    matches = [];
    currentMatch = -1;
  }

  function doSearch(query) {
    clearHighlights();
    var q = (query || '').trim();
    if (q.length < 2) {
      countEl.textContent = '';
      return;
    }
    var escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp(escaped, 'gi');
    var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    while (walker.nextNode()) {
      var node = walker.currentNode;
      if (node.textContent.match(re)) nodes.push(node);
    }
    for (var i = 0; i < nodes.length; i++) {
      var span = document.createElement('span');
      span.innerHTML = nodes[i].textContent.replace(re, '<mark class="sb-highlight">$&</mark>');
      nodes[i].parentNode.replaceChild(span, nodes[i]);
    }
    matches = content.querySelectorAll('mark.sb-highlight');
    if (matches.length) {
      countEl.textContent = '1 / ' + matches.length;
      matches[0].classList.add('sb-highlight-active');
      matches[0].scrollIntoView({ block: 'center' });
      currentMatch = 0;
    } else {
      countEl.textContent = 'No results';
    }
  }

  function navigateMatch(dir) {
    if (!matches.length) return;
    matches[currentMatch].classList.remove('sb-highlight-active');
    currentMatch = (currentMatch + dir + matches.length) % matches.length;
    matches[currentMatch].classList.add('sb-highlight-active');
    matches[currentMatch].scrollIntoView({ block: 'center' });
    countEl.textContent = (currentMatch + 1) + ' / ' + matches.length;
  }

  if (input) {
    input.addEventListener('input', function () { doSearch(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateMatch(e.shiftKey ? -1 : 1);
      }
    });
  }
  if (prevBtn) prevBtn.addEventListener('click', function () { navigateMatch(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { navigateMatch(1); });

  // ── TOC scroll tracking ──────────────────────────────────────────
  var tocLinks = document.querySelectorAll('.sb-toc-list a');
  var headings = document.querySelectorAll('#sb-content h1, #sb-content h2, #sb-content h3');

  window.addEventListener('scroll', function () {
    var current = '';
    headings.forEach(function (h) {
      if (h.getBoundingClientRect().top <= 120) current = h.id;
    });
    tocLinks.forEach(function (link) {
      link.parentElement.classList.toggle('sb-toc-active', link.getAttribute('href') === '#' + current);
    });
  }, { passive: true });

  // ── File tabs ────────────────────────────────────────────────────
  var tabs = document.querySelectorAll('[data-file-tab]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-file-tab');
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      document.querySelectorAll('[data-file-content]').forEach(function (el) {
        el.style.display = el.getAttribute('data-file-content') === target ? 'block' : 'none';
      });
      content.scrollTop = 0;
    });
  });
})();
