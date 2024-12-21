// ==UserScript==
// @name         Universal Video Sharpener
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Applies video sharpening filter to streaming videos across websites
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        sharpnessValue: 0.0003,  // Reduced from original to minimize lag
        contrastBoost: 0.997,
        brightnessBoost: 1.02,
        debugMode: false
    };

    // Logging function
    function log(message) {
        if (CONFIG.debugMode) {
            console.log(`[Video Sharpener] ${message}`);
        }
    }

    // Create SVG filter more efficiently
    function createSVGFilter() {
        if (document.getElementById('universal-sharpness-filter')) return;

        const svgNamespace = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNamespace, 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.setAttribute('id', 'universal-sharpness-filter');

        const filter = document.createElementNS(svgNamespace, 'filter');
        filter.setAttribute('id', 'sharpness-filter');

        const feConvolve = document.createElementNS(svgNamespace, 'feConvolveMatrix');
        feConvolve.setAttribute('order', '3');
        feConvolve.setAttribute('preserveAlpha', 'true');
        feConvolve.setAttribute('kernelMatrix', '0 -1 0 -1 5 -1 0 -1 0');

        filter.appendChild(feConvolve);
        svg.appendChild(filter);

        document.body.appendChild(svg);
        log('SVG Filter created');
    }

    // Detect if an element is likely a video
    function isVideoElement(element) {
        return element instanceof HTMLVideoElement &&
               element.videoWidth > 0 &&
               element.videoHeight > 0 &&
               !element.paused;
    }

    // Apply sharpness filter
    function applySharpnessFilter(video, isEnabled) {
        if (!video) return;

        try {
            if (isEnabled) {
                const { sharpnessValue, contrastBoost, brightnessBoost } = CONFIG;
                video.style.filter = `
                    url(#sharpness-filter)
                    contrast(${contrastBoost})
                    brightness(${brightnessBoost})
                `;
                log('Sharpness filter applied');
            } else {
                video.style.filter = 'none';
                log('Sharpness filter removed');
            }
        } catch (error) {
            console.error('Error applying sharpness filter:', error);
        }
    }

    // Main processing function
    function processVideos() {
        const isScriptEnabled = GM_getValue('universalSharpenerEnabled', false);
        if (!isScriptEnabled) return;

        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (isVideoElement(video)) {
                applySharpnessFilter(video, true);
            }
        });
    }

    // Initialize script
    function initScript() {
        createSVGFilter();

        // Global toggle menu command
        GM_registerMenuCommand('Toggle Video Sharpener', () => {
            const currentState = GM_getValue('universalSharpenerEnabled', false);
            GM_setValue('universalSharpenerEnabled', !currentState);
            location.reload();
        });

        // Use IntersectionObserver for efficient video tracking
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && isVideoElement(entry.target)) {
                    processVideos();
                }
            });
        }, { threshold: 0.5 });

        // Observe all video elements
        document.querySelectorAll('video').forEach(video => {
            observer.observe(video);
        });

        // Periodic check for new videos
        setInterval(processVideos, 2000);
    }

    // Start script
    initScript();
})();