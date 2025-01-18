// ==UserScript==
// @name         Stream To Android Player
// @namespace    https://github.com/faisalbhuiyan
// @version      1.0
// @description  Detect streaming videos and open them in external Android apps
// @author       Faisal Bhuiyan
// @match        *://*/*
// @grant        none
// @license      MIT
// @run-at       document-start
// ==/UserScript==
 
(function() {
    'use strict';
    
    let streams = [];
    let originalXHROpen = XMLHttpRequest.prototype.open;
    let originalFetchOpen = window.fetch;
 
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        #video-handler-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 48px;
            height: 48px;
            background: none;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 999999;
            font-size: 24px;
            transition: opacity 0.3s;
        }
 
        #video-handler-button:hover {
            opacity: 1;
        }
 
        #video-handler-menu {
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 8px;
            z-index: 999998;
            max-height: 300px;
            overflow-y: auto;
            color: white;
            max-width: 300px;
            width: auto;
        }
 
        .stream-item {
            padding: 8px 16px;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
 
        .stream-item:last-child {
            border-bottom: none;
        }
 
        .stream-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }
    `;
    document.head.appendChild(style);
 
    // Clear streams when page unloads
    window.addEventListener('beforeunload', () => {
        streams = [];
        const menu = document.getElementById('video-handler-menu');
        const button = document.getElementById('video-handler-button');
        if (menu) menu.remove();
        if (button) button.remove();
    });
 
    function createStreamMenu() {
        const menu = document.createElement('div');
        menu.id = 'video-handler-menu';
        menu.style.display = 'none';
        document.body.appendChild(menu);
        return menu;
    }
 
    function shareUrl(url) {
        if (navigator.share) {
            navigator.share({
                url: url
            }).catch(console.error);
        }
    }
 
    function updateMenu() {
        const menu = document.getElementById('video-handler-menu') || createStreamMenu();
        menu.innerHTML = streams.map(stream => `
            <div class="stream-item" data-url="${stream.url}" title="${stream.name}">
                ${stream.name}
            </div>
        `).join('');
 
        menu.querySelectorAll('.stream-item').forEach(item => {
            item.onclick = () => {
                shareUrl(item.dataset.url);
            };
        });
    }
 
    function createFloatingButton() {
        const button = document.createElement('div');
        button.id = 'video-handler-button';
        button.innerHTML = '▶️';
        button.style.display = 'none';
        document.body.appendChild(button);
 
        button.onclick = () => {
            const menu = document.getElementById('video-handler-menu');
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        };
 
        return button;
    }
 
    function handleStreamDetection(url) {
        if (url.includes('.mp4') || url.includes('.m3u8') || url.includes('urlset')) {
            const fileName = url.split('/').pop().split('?')[0];
            if (!streams.some(s => s.url === url)) {
                streams.push({ url, name: fileName });
                const button = document.getElementById('video-handler-button') || createFloatingButton();
                button.style.display = 'block';
                updateMenu();
            }
        }
    }
 
    // Monitor XHR requests
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
            handleStreamDetection(this.responseURL);
        });
        originalXHROpen.apply(this, arguments);
    };
 
    // Monitor fetch requests
    window.fetch = function() {
        const url = arguments[0]?.url || arguments[0];
        handleStreamDetection(url);
        return originalFetchOpen.apply(this, arguments);
    };
 
    // Monitor media elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'VIDEO' || node.nodeName === 'AUDIO') {
                    handleStreamDetection(node.src);
                }
            });
        });
    });
 
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();