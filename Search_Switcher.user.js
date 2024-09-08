// ==UserScript==
// @name         Search Switcher FB
// @namespace    http://tampermonkey.net/
// @version      2024-09-08
// @description  switches search engine from google to other sites
// @author       Faisal Bhuiyan
// @match              *://*.bing.com/*search*
// @match        https://www.google.com/search*
// @match        https://www.qwant.com/*
// @match              *://yandex.com/*search*
// @match              *://search.brave.com/*
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
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
        }
    ];

    // Create the floating select box
    const selectBox = document.createElement('select');
    selectBox.style.position = 'fixed';
    selectBox.style.top = '20px';
    selectBox.style.right = '5rem';
    selectBox.style.zIndex = '9999'; // Ensures it's above other elements
    selectBox.style.fontSize = '16px';
    selectBox.style.padding = '5px';
    selectBox.style.borderRadius = '4px';
    selectBox.style.backgroundColor = '#fff';
    selectBox.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';

    // Add an empty option as the first element
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Select';
    emptyOption.disabled = true; // Make it unselectable after initial choice
    emptyOption.selected = true; // Make it the default option
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
        const selectedEngine = searchEngines[selectBox.selectedIndex - 1]; // Adjusted index
        const currentQuery = new URLSearchParams(window.location.search).get('q');
        if (currentQuery && selectedEngine) {
            window.location.href = `${selectedEngine.url}?${selectedEngine.param}=${encodeURIComponent(currentQuery)}`;
        }
    });
})();
