// ==UserScript==
// @name         Override .HrpFrame Widths
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // Create a <style> element with your overrides
  const style = document.createElement('style');
  style.textContent = `
    .HrpFrame {
      min-width: 200px !important;
      max-width: 300px !important;
    }
  `;

  // Append it once to <head> (or <html> if head is missing)
  (document.head || document.documentElement).appendChild(style);
})();
