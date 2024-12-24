// ==UserScript==
// @name         Instant Search Switcher
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Changes search engine from one site to another without deleting search query.
// @author       Faisal Bhuiyan
// @match              *://*.bing.com/*search*
// @match              *://*.bing.com/chat*
// @match        https://www.google.com/search*
// @match        https://www.qwant.com/*
// @match              *://yandex.com/*search*
// @match              *://search.brave.com/*search*
// @match              *://duckduckgo.com/*
// @license      MIT
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/518797/Instant%20Search%20Switcher.user.js
// @updateURL https://update.greasyfork.org/scripts/518797/Instant%20Search%20Switcher.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const searchEngines = [
        {
            name: 'Google',
            url: 'https://www.google.com/search',
            param: 'q'
        },
        {
            name: 'Bing',
            url: 'https://www.bing.com/search',
            param: 'q'
        },
        {
            name: 'Copilot',
            url: 'https://www.bing.com/chat',
            param: 'q',
            additionalParams: '&sendquery=1&FORM=SCCODX'
        },
        {
            name: 'Qwant',
            url: 'https://www.qwant.com/',
            param: 'q'
        },
        {
            name: 'Brave',
            url: 'https://search.brave.com/search',
            param: 'q'
        },
        {
            name: 'Yandex',
            url: 'https://yandex.com/search',
            param: 'text'
        },
        {
            name: 'Perplexity',
            url: 'https://www.perplexity.ai/search',
            param: 'q'
        },
        {
            name: 'Phind',
            url: 'https://www.phind.com/search',
            param: 'q'
        },
        {
            name: 'Morphic',
            url: 'https://morphic.sh/search',
            param: 'q'
        },
        {
            name: 'DuckDuckGo',
            url: 'https://duckduckgo.com/',
            param: 'q'
        }
    ];

    // Create the floating select box
    const selectBox = document.createElement('select');
    selectBox.style.position = 'fixed';
    selectBox.style.top = '20px';
    selectBox.style.right = '5rem';
    selectBox.style.zIndex = '9999';
    selectBox.style.fontSize = '16px';
    selectBox.style.padding = '5px';
    selectBox.style.borderRadius = '4px';
    selectBox.style.backgroundColor = '#fff';
    selectBox.style.color = '#000'; // Force black text
    selectBox.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';

    // Add CSS to ensure text remains visible in both light and dark themes
    const style = document.createElement('style');
    style.textContent = `
        .search-switcher-select {
            color: #000 !important;
            -webkit-text-fill-color: #000 !important;
        }
        .search-switcher-select option {
            background-color: #fff !important;
            color: #000 !important;
            -webkit-text-fill-color: #000 !important;
        }
    `;
    document.head.appendChild(style);

    selectBox.className = 'search-switcher-select';

    // Add an empty option as the first element
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Select';
    emptyOption.disabled = true;
    emptyOption.selected = true;
    selectBox.appendChild(emptyOption);

    // Add search engines to the select box
    searchEngines.forEach(engine => {
        const option = document.createElement('option');
        option.value = engine.url;
        option.textContent = engine.name;
        selectBox.appendChild(option);
    });

    // Append the select box to the body
    document.body.appendChild(selectBox);

    // Detect changes to the select box
    selectBox.addEventListener('change', () => {
        const selectedEngine = searchEngines[selectBox.selectedIndex - 1];
        // Try to get query parameter from either 'q' or 'text' depending on current search engine
        const currentQuery = new URLSearchParams(window.location.search).get('q') ||
                           new URLSearchParams(window.location.search).get('text');

        if (currentQuery && selectedEngine) {
            const additionalParams = selectedEngine.additionalParams || '';
            window.location.href = `${selectedEngine.url}?${selectedEngine.param}=${encodeURIComponent(currentQuery)}${additionalParams}`;
        }
    });
})();