// ==UserScript==
// @name         Universal Video Sharpener (CSS Filter)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Applies video sharpening using CSS filters across websites
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        contrast: 1.1,      // Increased contrast
        brightness: 1.2,   // Slight brightness boost
        saturate: 1.1,      // Increased color saturation
        debugMode: false
    };

    // Logging function
    function log(message) {
        if (CONFIG.debugMode) {
            console.log(`[Video Sharpener] ${message}`);
        }
    }

    // Detect if an element is likely a video
    function isVideoElement(element) {
        return element instanceof HTMLVideoElement &&
               element.videoWidth > 0 &&
               element.videoHeight > 0 &&
               !element.paused;
    }

    // Apply CSS sharpness filter
    function applySharpnessFilter(video, isEnabled) {
        if (!video) return;

        try {
            if (isEnabled) {
                const { contrast, brightness, saturate } = CONFIG;
                video.style.filter = `
                    contrast(${contrast})
                    brightness(${brightness})
                    saturate(${saturate})
                `;
                video.dataset.sharpened = 'true';
                log('CSS Sharpness filter applied');
            } else {
                video.style.filter = 'none';
                delete video.dataset.sharpened;
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

        const videos = document.querySelectorAll('video:not([data-sharpened])');
        videos.forEach(video => {
            if (isVideoElement(video)) {
                applySharpnessFilter(video, true);
            }
        });
    }

    // Initialize script
    function initScript() {
        // Global toggle menu command
        GM_registerMenuCommand('Toggle Video Sharpener', () => {
            const currentState = GM_getValue('universalSharpenerEnabled', false);
            GM_setValue('universalSharpenerEnabled', !currentState);
            location.reload();
        });

        // Use MutationObserver for dynamic content
        const observer = new MutationObserver(() => {
            processVideos();
        });

        // Observe the entire document for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial processing and periodic check
        processVideos();
        setInterval(processVideos, 3000);
    }

    // Start script
    initScript();
})();