// ==UserScript==
// @name         Brave Search Default for Opera
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically redirects searches to Brave Search
// @match        *://*/*
// @grant        window.stop
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const config = {
        targetEngine: {
            name: 'Brave Search',
            url: 'https://search.brave.com/search?q=%s'
        },
        excludeDomains: new Set([
            'search.brave.com'
        ])
    };

    // Exit if we're already on the target search engine
    const hostname = location.hostname;
    if ([...config.excludeDomains].some(domain => hostname.includes(domain))) return;

    // Get query parameters fast
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || params.get('search_query') || params.get('text');

    if (!query) return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Stop the page load immediately
    window.stop();

    // Clear any existing content and prevent further loading
    if (document.documentElement) {
        document.documentElement.innerHTML = '';
    }

    // Cancel any pending requests
    if (window.stop) {
        window.stop();
    }

    // Redirect to Brave Search using the fastest method
    const redirectUrl = config.targetEngine.url.replace('%s', encodeURIComponent(trimmedQuery));

    // Try several redirection methods for maximum compatibility and speed
    try {
        window.location.replace(redirectUrl);
    } catch {
        window.location.href = redirectUrl;
    }

    throw new Error('REDIRECT_COMPLETE');
})();