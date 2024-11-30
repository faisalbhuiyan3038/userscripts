// ==UserScript==
// @name         Site Search for Arc Browser
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Enables site search shortcuts using shortcuts
// @author       Faisal Bhuiyan
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @noframes
// ==/UserScript==

(function() {
    'use strict';
    const start = performance.now();
    
    // List of search engines with their shortcuts and URLs
    const searchEngines = [
        {
            shortcut: '@perplexity',
            url: 'https://perplexity.ai/search?q=%s'
        },
        {
            shortcut: '@brave',
            url: 'https://search.brave.com/search?q=%s'
        },
        {
            shortcut: '@youtube',
            url: 'https://www.youtube.com/results?search_query=%s'
        },
        {
            shortcut: '@morphic',
            url: 'https://morphic.sh/search?q=%s'
        },
        {
            shortcut: '@qwant',
            url: 'https://www.qwant.com/?q=%s'
        },
        {
            shortcut: '@phind',
            url: 'https://www.phind.com/search?q=%s'
        },
        {
            shortcut: '@yandex',
            url: 'https://yandex.com/search/?text=%s'
        }
    ];

    // Generate searchDomains from searchEngines URLs
    const searchDomains = new Set(
        searchEngines.map(engine => {
            try {
                return new URL(engine.url.replace('%s', '')).hostname;
            } catch {
                return '';
            }
        }).filter(Boolean)
    );
    
    const hostname = location.hostname;
    
    if ([...searchDomains].some(domain => hostname.includes(domain))) return;

    const params = new URLSearchParams(location.search);
    const query = params.get('q') || params.get('search_query');
    
    if (!query) return;

    const trimmedQuery = query.trim();
    
    const engine = searchEngines.find(e => trimmedQuery.startsWith(e.shortcut));
    
    if (engine) {
        const searchQuery = trimmedQuery.replace(engine.shortcut, '').trim();
        if (searchQuery) {
            if (window.stop) window.stop();
            
            document.documentElement.innerHTML = '';
            
            const redirectUrl = engine.url.replace('%s', encodeURIComponent(searchQuery));
            location.replace(redirectUrl);
            
            throw new Error('REDIRECT_COMPLETE');
        }
    }

    const end = performance.now();
    console.debug(`Arc Search executed in ${end - start}ms`);
})();