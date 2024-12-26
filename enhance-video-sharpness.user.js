// ==UserScript==
// @name         Universal Video Sharpness Enhanced
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Toggle video sharpening with SVG filter and CSS fallback
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const STORAGE_KEY = 'videoSharpnessEnabled';
    const SHARPNESS_FILTER = {
        svg: `
            <svg xmlns="http://www.w3.org/2000/svg">
                <filter id="sharpness-filter">
                    <feConvolveMatrix
                        order="3"
                        kernelMatrix="1 -1 1 -1 -1 -1 1 -1 1">
                    </feConvolveMatrix>
                </filter>
            </svg>
        `,
        css: 'contrast(110%) brightness(110%) saturate(120%) sharp(1.5)'
    };

    // Check if SVG filter is supported
    function isSVGFilterSupported() {
        return !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGFilter;
    }

    // Apply sharpness filter
    function applySharpnessFilter(video) {
        if (isSVGFilterSupported()) {
            // Primary method: SVG Filter
            const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgContainer.innerHTML = SHARPNESS_FILTER.svg;
            document.body.appendChild(svgContainer);
            video.style.filter = 'url(#sharpness-filter)';
        } else {
            // Fallback: CSS Filter
            video.style.filter = SHARPNESS_FILTER.css;
        }
    }

    // Remove sharpness filter
    function removeSharpnessFilter(video) {
        video.style.filter = 'none';
    }

    // Toggle sharpness for all videos
    function toggleVideoSharpness() {
        const isEnabled = !GM_getValue(STORAGE_KEY, false);
        GM_setValue(STORAGE_KEY, isEnabled);

        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            isEnabled ? applySharpnessFilter(video) : removeSharpnessFilter(video);
        });

        // Update menu command label
        GM_registerMenuCommand(
            `${isEnabled ? '✓' : '✗'} Toggle Video Sharpness`,
            toggleVideoSharpness
        );
    }

    // Initialize on page load
    function init() {
        const isEnabled = GM_getValue(STORAGE_KEY, false);
        GM_registerMenuCommand(
            `${isEnabled ? '✓' : '✗'} Toggle Video Sharpness`,
            toggleVideoSharpness
        );

        // Apply to existing videos
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (isEnabled) applySharpnessFilter(video);
        });

        // Watch for dynamically added videos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'VIDEO') {
                        if (GM_getValue(STORAGE_KEY, false)) {
                            applySharpnessFilter(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Run initialization
    init();
})();