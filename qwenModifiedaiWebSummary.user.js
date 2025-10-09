// ==UserScript==
// @name         AI Web Summarizer
// @namespace    http://tampermonkey.net/
// @version      0.3 // <-- MODIFIED version
// @description  Floating AI summarizer button for web pages - Draggable, Toasts, Configurable Hotkey, Import/Export, Reordering, Char Limit Fix, Error Handling, textContent, DOM Reuse
// @author       Faisal Bhuiyan
// @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Default Chatbots
    const DEFAULT_CHATBOTS = {
        'byok': { id: 'byok', name: 'Gemini API', url: 'https://aistudio.google.com/apikey', characterLimit: 100000, premiumCharacterLimit: 200000 },
        'chatgpt': { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', characterLimit: 40000, premiumCharacterLimit: 200000 },
        'claude': { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', characterLimit: 50000, premiumCharacterLimit: 250000 },
        'gemini': { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', characterLimit: 32000, premiumCharacterLimit: 250000 },
        'grok': { id: 'grok', name: 'Grok', url: 'https://grok.com', characterLimit: 100000, premiumCharacterLimit: 200000 },
        'deepseek': { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', characterLimit: 200000, premiumCharacterLimit: 200000 },
        'gemini_studio': { id: 'gemini_studio', name: 'Gemini AI Studio', url: 'https://aistudio.google.com/prompts/new_chat', characterLimit: 100000, premiumCharacterLimit: 200000 }
    };

    // Default Prompts
    const DEFAULT_PROMPTS = [
        { id: 'summary', name: 'Summary - Short', content: `Please summarize the following text in under 100 words.
Instructions
1. The summary should be well formatted and easily scannable.
2. Don't start the text with "Let me...", or "Here is the summary...". Just give the results.
3. Please keep it SHORT, no more than 100 words!`, isDefault: true },
        { id: '5-10-points', name: '5-10 Key Points - Short', content: `Please provide the 5-10 most important points from the text.
Use bullet points and emojis to break up the text.` },
        { id: 'key-points-summary', name: 'Summary with Key Points & Takeaways - Detailed', content: `Please provide a summary of the following content in its original tone:
1. First, give a concise one-sentence summary that captures the core message/theme
2. Then, share a breakdown of the main topics discussed. For each topic:
    - Expound very briefly on what was discussed on each topic
    - Include any notable quotes or statistics if any.
3. End with a brief takeaways
4. Don't go beyond 200 words.
5. Don't start the text with "Let me...", or "Here is the summary...". Just give the results.` },
        { id: 'short-form', name: 'Blinkist-Like Summary - Detailed', content: `Summarize the following content how Blinkist would.
Keep the tone of the content. Keep it conversational.
Break the headers using relevant dynamic emojis.
Go beyond the title in giving the summary, look through entire content.
Sprinkle in quotes or excerpts to better link the summary to the content.
For less than 30 mins long content, don't go beyond 150 words.
For 1hr+ long content don't go beyond 300 words.
Don't start the text with "Let me...", or "Here is the summary...". Just give the results.` }
    ];

    // Truncation Config
    const TRUNC_CONFIG = {
        characterLimit: 20000,
        initialContentRatio: 0.4,
        chunkSize: 300,
        minChunksPerSegment: 3
    };

    // Storage Helpers
    function getStored(key, defaultVal) {
        return GM_getValue(key, defaultVal);
    }
    function setStored(key, val) {
        GM_setValue(key, val);
    }

    // Initialize storage
    if (!getStored('selectedBotId')) setStored('selectedBotId', 'chatgpt');
    if (!getStored('selectedPromptId')) setStored('selectedPromptId', 'summary');
    if (!getStored('excludedSites')) setStored('excludedSites', []);
    if (!getStored('customChatbots')) setStored('customChatbots', {});
    if (!getStored('customPrompts')) setStored('customPrompts', []);
    if (!getStored('hotkey')) setStored('hotkey', 'Ctrl+J'); // <-- ADDED
    if (!getStored('positions')) setStored('positions', {}); // <-- ADDED

    // Get all chatbots (default + custom)
    function getAllChatbots() {
        const custom = getStored('customChatbots', {});
        return { ...DEFAULT_CHATBOTS, ...custom };
    }

    // Get all prompts (default + custom)
    function getAllPrompts() {
        const custom = getStored('customPrompts', []);
        return [...DEFAULT_PROMPTS, ...custom];
    }

    // Theme Detection
    function isDarkMode() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // --- DRAGGABLE BUTTON LOGIC START ---
    let isDragging = false;
    let dragStartX, dragStartY;
    let initialX, initialY;

    function getDraggablePosition() {
        const positions = getStored('positions', {});
        const hostname = window.location.hostname.replace(/^www\./, '');
        return positions[hostname] || { x: '0px', y: '80px' }; // Default bottom-right
    }

    function saveDraggablePosition(x, y) {
        const positions = getStored('positions', {});
        const hostname = window.location.hostname.replace(/^www\./, '');
        positions[hostname] = { x: x, y: y };
        setStored('positions', positions);
    }

    function handleDragStart(e) {
        isDragging = true;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (!clientX || !clientY) return;

        const style = window.getComputedStyle(container);
        initialX = parseInt(style.left, 10) || 0;
        initialY = parseInt(style.top, 10) || parseInt(style.bottom, 10) || 0; // Fallback to bottom if top not set

        dragStartX = clientX;
        dragStartY = clientY;

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        e.preventDefault(); // Prevent text selection during drag

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (!clientX || !clientY) return;

        const dx = clientX - dragStartX;
        const dy = clientY - dragStartY;

        const newX = initialX + dx;
        // For vertical positioning, decide if using top or bottom
        // Assuming initialY was bottom, calculate top for positioning
        const newTop = window.innerHeight - (initialY + dy); // Adjust for bottom positioning

        container.style.left = `${newX}px`;
        container.style.top = `${newTop}px`;
        container.style.bottom = 'auto'; // Explicitly set to auto when using top
    }

    function handleDragEnd() {
        if (isDragging) {
            isDragging = false;
            const currentX = parseInt(container.style.left, 10) || 0;
            // Calculate bottom based on top for saving
            const currentTop = parseInt(container.style.top, 10) || 0;
            const currentBottom = window.innerHeight - currentTop;
            saveDraggablePosition(`${currentX}px`, `${currentBottom}px`);
        }
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    }
    // --- DRAGGABLE BUTTON LOGIC END ---


    // --- TOAST NOTIFICATION LOGIC START ---
    function showToast(message) {
        const toast = document.getElementById('jsTLDR-toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('jsTLDR-toast-show');
            setTimeout(() => {
                toast.classList.remove('jsTLDR-toast-show');
            }, 2000);
        } else {
            console.warn("Toast element not found, cannot show message:", message);
        }
    }
    // --- TOAST NOTIFICATION LOGIC END ---


    // --- UPDATE MAIN BUTTON TOOLTIP START ---
    function updateMainButtonTooltip() {
        const selectedBotId = getStored('selectedBotId');
        const selectedPromptId = getStored('selectedPromptId');
        const allBots = getAllChatbots();
        const allPrompts = getAllPrompts();

        const bot = allBots[selectedBotId];
        const prompt = allPrompts.find(p => p.id === selectedPromptId);

        const botName = bot ? bot.name : 'Unknown Bot';
        const promptName = prompt ? prompt.name : 'Unknown Prompt';

        mainButton.title = `🤖 ${botName} | 📝 ${promptName}`;
    }
    // --- UPDATE MAIN BUTTON TOOLTIP END ---


    // Styles with namespacing - Added toast style
    GM_addStyle(`
        #jsTLDR-container {
            position: fixed !important;
            /* Removed initial bottom/right positioning, will be set by script */
            z-index: 2147483647 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            /* Initial cursor to indicate draggable */
            cursor: move;
        }
        #jsTLDR-main-button {
            width: 40px !important;
            height: 40px !important;
            background: rgba(255,255,255,0.1) !important;
            opacity: 0.5 !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 16px 0 0 16px !important;
            border: none !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        #jsTLDR-main-button:hover {
            opacity: 1 !important;
            transform: translateX(-2px) !important;
            background: rgba(255,255,255,0.2) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .jsTLDR-popup-menu {
            position: absolute !important;
            bottom: 44px !important;
            right: 2px !important;
            display: none !important;
            flex-direction: column !important;
            gap: 8px !important;
            background: ${isDarkMode() ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)'} !important;
            border: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
            border-radius: 8px !important;
            padding: 8px !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
            z-index: 2147483647 !important;
        }
        .jsTLDR-popup-menu.jsTLDR-show {
            display: flex !important;
        }
        .jsTLDR-menu-button {
            width: 32px !important;
            height: 32px !important;
            background: ${isDarkMode() ? 'rgba(60,60,60,0.8)' : 'rgba(240,240,240,0.8)'} !important;
            border: none !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            font-size: 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        .jsTLDR-menu-button:hover {
            background: ${isDarkMode() ? 'rgba(80,80,80,0.9)' : 'rgba(220,220,220,0.9)'} !important;
            transform: scale(1.05) !important;
        }
        .jsTLDR-dropdown {
            position: absolute !important;
            right: 40px !important;
            bottom: 0 !important;
            width: 220px !important;
            max-height: 300px !important;
            overflow-y: auto !important;
            background: ${isDarkMode() ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)'} !important;
            border: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
            border-radius: 8px !important;
            padding: 4px !important;
            display: none !important;
            z-index: 2147483648 !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        }
        .jsTLDR-dropdown.jsTLDR-show {
            display: block !important;
        }
        .jsTLDR-dropdown-item {
            padding: 10px 12px !important;
            cursor: pointer !important;
            border: none !important;
            width: 100% !important;
            text-align: left !important;
            background: transparent !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
            border-radius: 4px !important;
            transition: background 0.15s !important;
            font-size: 14px !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
        }
        .jsTLDR-dropdown-item:hover {
            background: ${isDarkMode() ? 'rgba(80,80,80,0.5)' : 'rgba(0,0,0,0.05)'} !important;
        }
        .jsTLDR-dropdown-item.jsTLDR-selected {
            background: ${isDarkMode() ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)'} !important;
            color: ${isDarkMode() ? '#60a5fa' : '#2563eb'} !important;
        }
        .jsTLDR-checkmark {
            font-size: 12px !important;
            margin-left: 8px !important;
        }
        /* Modal Styles */
        .jsTLDR-modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0,0,0,0.6) !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 2147483646 !important;
            padding: 20px !important;
        }
        .jsTLDR-modal-overlay.jsTLDR-show {
            display: flex !important;
        }
        .jsTLDR-modal {
            background: ${isDarkMode() ? '#1a1a1a' : '#ffffff'} !important;
            border-radius: 12px !important;
            width: 100% !important;
            max-width: 600px !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        .jsTLDR-modal-header {
            padding: 20px 24px !important;
            border-bottom: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
        }
        .jsTLDR-modal-title {
            font-size: 18px !important;
            font-weight: 600 !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        .jsTLDR-modal-close {
            background: none !important;
            border: none !important;
            font-size: 24px !important;
            cursor: pointer !important;
            color: ${isDarkMode() ? '#999' : '#666'} !important;
            padding: 0 !important;
            margin: 0 !important;
            line-height: 1 !important;
        }
        .jsTLDR-modal-close:hover {
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
        }
        .jsTLDR-modal-body {
            padding: 24px !important;
        }
        .jsTLDR-tabs {
            display: flex !important;
            gap: 8px !important;
            margin-bottom: 20px !important;
            border-bottom: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
        }
        .jsTLDR-tab {
            padding: 10px 16px !important;
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            color: ${isDarkMode() ? '#999' : '#666'} !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            border-bottom: 2px solid transparent !important;
            transition: all 0.2s !important;
        }
        .jsTLDR-tab.jsTLDR-active {
            color: ${isDarkMode() ? '#60a5fa' : '#2563eb'} !important;
            border-bottom-color: ${isDarkMode() ? '#60a5fa' : '#2563eb'} !important;
        }
        .jsTLDR-tab-content {
            display: none !important;
        }
        .jsTLDR-tab-content.jsTLDR-active {
            display: block !important;
        }
        .jsTLDR-form-group {
            margin-bottom: 16px !important;
        }
        .jsTLDR-label {
            display: block !important;
            margin-bottom: 6px !important;
            color: ${isDarkMode() ? '#ccc' : '#333'} !important;
            font-size: 14px !important;
            font-weight: 500 !important;
        }
        .jsTLDR-input, .jsTLDR-textarea {
            width: 100% !important;
            padding: 10px 12px !important;
            background: ${isDarkMode() ? '#2a2a2a' : '#f5f5f5'} !important;
            border: 1px solid ${isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
            border-radius: 6px !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
            font-size: 14px !important;
            font-family: inherit !important;
            box-sizing: border-box !important;
        }
        .jsTLDR-textarea {
            min-height: 120px !important;
            resize: vertical !important;
        }
        .jsTLDR-button {
            padding: 10px 20px !important;
            background: ${isDarkMode() ? '#3b82f6' : '#2563eb'} !important;
            color: #fff !important;
            border: none !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            transition: background 0.2s !important;
        }
        .jsTLDR-button:hover {
            background: ${isDarkMode() ? '#2563eb' : '#1d4ed8'} !important;
        }
        .jsTLDR-button-secondary {
            background: ${isDarkMode() ? '#374151' : '#e5e7eb'} !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
        }
        .jsTLDR-button-secondary:hover {
            background: ${isDarkMode() ? '#4b5563' : '#d1d5db'} !important;
        }
        .jsTLDR-list-item {
            padding: 12px !important;
            background: ${isDarkMode() ? '#2a2a2a' : '#f5f5f5'} !important;
            border-radius: 6px !important;
            margin-bottom: 8px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        .jsTLDR-list-item-content {
            flex: 1 !important;
        }
        .jsTLDR-list-item-title {
            font-weight: 500 !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
            margin-bottom: 2px !important;
        }
        .jsTLDR-list-item-subtitle {
            font-size: 12px !important;
            color: ${isDarkMode() ? '#999' : '#666'} !important;
        }
        .jsTLDR-list-item-actions {
            display: flex !important;
            gap: 4px !important; /* Reduced gap for new buttons */
        }
        .jsTLDR-icon-button {
            padding: 6px 10px !important;
            background: ${isDarkMode() ? '#374151' : '#e5e7eb'} !important;
            border: none !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            color: ${isDarkMode() ? '#fff' : '#000'} !important;
        }
        .jsTLDR-icon-button:hover {
            background: ${isDarkMode() ? '#4b5563' : '#d1d5db'} !important;
        }
        .jsTLDR-icon-button.jsTLDR-danger:hover {
            background: #dc2626 !important;
            color: #fff !important;
        }
        @media (max-width: 640px) {
            .jsTLDR-modal {
                max-width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
                max-height: 100vh !important;
            }
            .jsTLDR-dropdown {
                width: 200px !important;
            }
        }
        /* Toast Notification Styles */
        .jsTLDR-toast {
            position: fixed !important;
            bottom: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) translateY(100%) !important;
            background: rgba(0, 0, 0, 0.8) !important;
            color: white !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            z-index: 2147483647 !important; /* Very high z-index */
            transition: transform 0.3s ease !important;
            font-size: 14px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }
        .jsTLDR-toast.jsTLDR-toast-show {
            transform: translateX(-50%) translateY(0) !important;
        }
    `);

    // Extract Page Content
    async function extractPageContent() {
        const ignore = 'nav, aside, header, footer, button, script, style';
        const targets = ['h1','h2','h3','h4','h5','h6','p','li','td','div:not(:empty)']
            .map(tag => `${tag}:not(${ignore}):not(${ignore} *)`).join(', ');
        const els = document.querySelectorAll(targets);
        let content = '';
        for (const el of els) {
            if (el.offsetHeight === 0 || el.closest(ignore) || !el.textContent?.trim()) continue; // <-- MODIFIED: textContent
            const parent = el.parentElement;
            if (parent && (parent.matches('h1,h2,h3,h4,h5,h6,div,span,p,li') || parent.closest('h1,h2,h3,h4,h5,h6,div,span,p,li'))) continue;
            let text = el.textContent.trim().replace(/<[^>]+>/g, '').trim(); // <-- MODIFIED: textContent
            if (!text) continue;
            switch (el.tagName.toLowerCase()) {
                case 'h1': content += `# ${text}\n`; break;
                case 'h2': content += `## ${text}\n`; break;
                case 'h3': content += `### ${text}\n`; break;
                case 'h4': case 'h5': case 'h6': content += `#### ${text}\n`; break;
                case 'li': content += `• ${text}\n`; break;
                default: content += `${text}\n`;
            }
        }
        return content.replace(/\n{2,}/g, '\n');
    }

    // Truncation Helpers
    function chunkText(text, size) {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            if (start + size >= text.length) {
                chunks.push(text.slice(start).trim());
                break;
            }
            let slice = text.slice(start, start + size);
            const lastSpace = slice.lastIndexOf(' ');
            slice = slice.slice(0, lastSpace);
            start += lastSpace + 1;
            chunks.push(slice.trim());
        }
        return chunks;
    }
    function totalLength(chunks) {
        return chunks.reduce((sum, c) => sum + c.length, 0);
    }
    function getProportions(total, num) {
        if (total <= 0 || num <= 0) return [];
        const props = [];
        const step = 1 / (num + 1);
        for (let i = 1; i <= num; i++) props.push(step * i);
        return props;
    }
    function truncateText(text, config) {
        const cfg = { ...TRUNC_CONFIG, ...config };
        if (text.length <= cfg.characterLimit) return text;
        const chunks = chunkText(text, cfg.chunkSize);
        const samples = [];
        let len = 0;
        const initLimit = Math.floor(cfg.characterLimit * cfg.initialContentRatio);
        let i = 0;
        while (i < chunks.length && len < initLimit) {
            const c = chunks[i];
            if (len + c.length <= initLimit) {
                samples.push(c);
                len += c.length;
            } else {
                const rem = initLimit - len;
                if (rem > 10) {
                    samples.push(c.slice(0, rem));
                    len += rem;
                }
                break;
            }
            i++;
        }
        const remChunks = chunks.slice(i);
        if (remChunks.length > 0) {
            const avg = totalLength(remChunks) / remChunks.length;
            const numSeg = Math.floor((cfg.characterLimit - len) / (avg * cfg.minChunksPerSegment));
            const props = getProportions(remChunks.length, numSeg);
            for (const p of props) {
                if (len >= cfg.characterLimit) break;
                const startIdx = Math.floor(remChunks.length * p);
                const numC = Math.min(cfg.minChunksPerSegment, remChunks.length - startIdx);
                for (let j = 0; j < numC; j++) {
                    const c = remChunks[startIdx + j];
                    const space = cfg.characterLimit - len;
                    if (c.length <= space) {
                        samples.push(c);
                        len += c.length;
                    } else if (space > 10) {
                        samples.push(c.slice(0, space));
                        len += space;
                        break;
                    }
                }
            }
        }
        return samples.join('').replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }

    // Summarize Action
    async function summarize() {
        try { // <-- ADDED: Try-catch for extraction
            const botId = getStored('selectedBotId');
            const promptId = getStored('selectedPromptId');
            const allBots = getAllChatbots();
            const allPrompts = getAllPrompts();
            const bot = allBots[botId];
            const prompt = allPrompts.find(p => p.id === promptId);

            if (!bot || !prompt) {
                alert('Please select a valid chatbot and prompt');
                return;
            }

            const raw = await extractPageContent(); // <-- MODIFIED: Wrapped in try-catch
            const botCharLimit = bot.characterLimit || Infinity; // Fallback if no limit set
            // Calculate available space for content
            const availableSpace = botCharLimit - prompt.content.length - 50; // 50 char buffer

            // Truncate content first based on available space
            const truncRaw = truncateText(raw, { characterLimit: availableSpace });

            // Combine prompt and truncated content
            const fullText = `${prompt.content}\nPage Content: ${truncRaw}`;

            // Final truncation if necessary (e.g., if prompt itself was very long)
            const final = truncateText(fullText, { characterLimit: botCharLimit });

            try { // <-- ADDED: Try-catch for clipboard
                GM_setClipboard(final);
                showToast(`Copied! Opening ${bot.name}...`); // <-- ADDED: Toast notification
                window.open(bot.url, '_blank');
            } catch (clipError) { // <-- ADDED: Alert if clipboard fails
                console.error("Clipboard copy failed:", clipError);
                alert("Failed to copy text to clipboard. Please check browser permissions.");
            }
        } catch (extractError) { // <-- ADDED: Show toast if extraction fails
            console.error("Content extraction failed:", extractError);
            showToast("Content extraction failed.");
        }
    }


    // UI State
    let menuHideTimeout = null;
    let lastTapTime = 0;

    // Create UI
    const container = document.createElement('div');
    container.id = 'jsTLDR-container';
    // Set initial position based on stored value or default
    const initialPos = getDraggablePosition();
    container.style.left = initialPos.x;
    container.style.bottom = initialPos.y;

    const mainButton = document.createElement('button');
    mainButton.id = 'jsTLDR-main-button';
    mainButton.innerHTML = '🤖'; // Or your original emoji
    mainButton.title = 'AI Summarizer'; // Initial tooltip

    // --- TOAST ELEMENT START ---
    const toast = document.createElement('div');
    toast.id = 'jsTLDR-toast';
    toast.className = 'jsTLDR-toast';
    document.body.appendChild(toast);
    // --- TOAST ELEMENT END ---

    const popupMenu = document.createElement('div');
    popupMenu.className = 'jsTLDR-popup-menu';

    // Show/hide menu with delay
    function showMenu() {
        if (menuHideTimeout) {
            clearTimeout(menuHideTimeout);
            menuHideTimeout = null;
        }
        popupMenu.classList.add('jsTLDR-show');
    }
    function hideMenuWithDelay() {
        menuHideTimeout = setTimeout(() => {
            popupMenu.classList.remove('jsTLDR-show');
        }, 300);
    }

    // --- DRAGGABLE EVENT LISTENERS START ---
    mainButton.addEventListener('mousedown', handleDragStart);
    mainButton.addEventListener('touchstart', handleDragStart, { passive: false });
    // --- DRAGGABLE EVENT LISTENERS END ---

    // Desktop hover
    mainButton.addEventListener('mouseenter', showMenu);
    mainButton.addEventListener('mouseleave', hideMenuWithDelay);
    popupMenu.addEventListener('mouseenter', showMenu);
    popupMenu.addEventListener('mouseleave', hideMenuWithDelay);

    // Desktop click
    mainButton.addEventListener('click', (e) => {
        e.preventDefault();
        summarize();
    });

    // Mobile tap (single = show menu, double = summarize)
    mainButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;
        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            // Double tap
            summarize();
        } else {
            // Single tap
            if (popupMenu.classList.contains('jsTLDR-show')) {
                popupMenu.classList.remove('jsTLDR-show');
            } else {
                showMenu();
            }
        }
        lastTapTime = now;
    });

    // Bot Dropdown
    const botBtn = document.createElement('button');
    botBtn.className = 'jsTLDR-menu-button';
    botBtn.innerHTML = '⚙️';
    const botDropdown = document.createElement('div');
    botDropdown.className = 'jsTLDR-dropdown';
    botDropdown.id = 'jsTLDR-bot-dropdown';

    function renderBotDropdown() {
        botDropdown.innerHTML = ''; // This part remains the same for simplicity, but could be optimized
        const allBots = getAllChatbots();
        const selectedId = getStored('selectedBotId');
        Object.values(allBots).forEach(bot => {
            const item = document.createElement('button');
            item.className = 'jsTLDR-dropdown-item';
            if (bot.id === selectedId) {
                item.classList.add('jsTLDR-selected');
            }
            item.innerHTML = `<span>${bot.name}</span>${bot.id === selectedId ? '<span class="jsTLDR-checkmark">✓</span>' : ''}`;
            item.onclick = () => {
                setStored('selectedBotId', bot.id);
                botDropdown.classList.remove('jsTLDR-show');
                renderBotDropdown();
                updateMainButtonTooltip(); // <-- ADDED: Update tooltip after selection
            };
            botDropdown.appendChild(item);
        });
    }
    botBtn.onclick = (e) => {
        e.stopPropagation();
        botDropdown.classList.toggle('jsTLDR-show');
        promptDropdown.classList.remove('jsTLDR-show');
        renderBotDropdown();
    };

    // Prompt Dropdown
    const promptBtn = document.createElement('button');
    promptBtn.className = 'jsTLDR-menu-button';
    promptBtn.innerHTML = '📝';
    const promptDropdown = document.createElement('div');
    promptDropdown.className = 'jsTLDR-dropdown';
    promptDropdown.id = 'jsTLDR-prompt-dropdown';

    function renderPromptDropdown() {
        promptDropdown.innerHTML = ''; // This part remains the same for simplicity, but could be optimized
        const allPrompts = getAllPrompts();
        const selectedId = getStored('selectedPromptId');
        allPrompts.forEach(prompt => {
            const item = document.createElement('button');
            item.className = 'jsTLDR-dropdown-item';
            if (prompt.id === selectedId) {
                item.classList.add('jsTLDR-selected');
            }
            item.innerHTML = `<span>${prompt.name}</span>${prompt.id === selectedId ? '<span class="jsTLDR-checkmark">✓</span>' : ''}`;
            item.onclick = () => {
                setStored('selectedPromptId', prompt.id);
                promptDropdown.classList.remove('jsTLDR-show');
                renderPromptDropdown();
                updateMainButtonTooltip(); // <-- ADDED: Update tooltip after selection
            };
            promptDropdown.appendChild(item);
        });
    }
    promptBtn.onclick = (e) => {
        e.stopPropagation();
        promptDropdown.classList.toggle('jsTLDR-show');
        botDropdown.classList.remove('jsTLDR-show');
        renderPromptDropdown();
    };

    // --- SETTINGS MODAL DOM REUSE START ---
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'jsTLDR-modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'jsTLDR-modal';
    modalOverlay.appendChild(modal);

    // Store initial modal structure parts for reuse
    const settingsModalContent = document.createElement('div');
    settingsModalContent.innerHTML = `
        <div class="jsTLDR-modal-header">
            <h2 class="jsTLDR-modal-title">Settings</h2>
            <button class="jsTLDR-modal-close">✕</button>
        </div>
        <div class="jsTLDR-modal-body">
            <div class="jsTLDR-tabs">
                <button class="jsTLDR-tab jsTLDR-active" data-tab="prompts">Custom Prompts</button>
                <button class="jsTLDR-tab" data-tab="chatbots">Custom Chatbots</button>
                <button class="jsTLDR-tab" data-tab="exclusions">Site Exclusions</button>
                <button class="jsTLDR-tab" data-tab="settings">General Settings</button> <!-- Added settings tab -->
            </div>
            <div class="jsTLDR-tab-content jsTLDR-active" data-content="prompts">
                <div id="jsTLDR-prompts-list"></div>
                <button class="jsTLDR-button" id="jsTLDR-add-prompt">+ Add Prompt</button>
            </div>
            <div class="jsTLDR-tab-content" data-content="chatbots">
                <div id="jsTLDR-chatbots-list"></div>
                <button class="jsTLDR-button" id="jsTLDR-add-chatbot">+ Add Chatbot</button>
            </div>
            <div class="jsTLDR-tab-content" data-content="exclusions">
                <div id="jsTLDR-exclusions-list"></div>
                <button class="jsTLDR-button" id="jsTLDR-add-exclusion">+ Exclude Current Site</button>
            </div>
            <div class="jsTLDR-tab-content" data-content="settings"> <!-- Added settings content -->
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">Hotkey (e.g., Ctrl+J, Ctrl+Shift+K)</label>
                    <input type="text" class="jsTLDR-input" id="jsTLDR-hotkey-input" value="${getStored('hotkey', 'Ctrl+J')}">
                </div>
                <div style="margin-top: 20px;">
                    <button class="jsTLDR-button jsTLDR-button-secondary" id="jsTLDR-export-settings">Export Settings</button>
                    <button class="jsTLDR-button jsTLDR-button-secondary" style="margin-left: 8px;" id="jsTLDR-import-settings">Import Settings</button>
                </div>
            </div>
        </div>
    `;

    function closeModal() {
        modalOverlay.classList.remove('jsTLDR-show');
    }
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) closeModal();
    };

    function renderModal() {
        // Clear modal and append the stored structure
        modal.innerHTML = '';
        modal.appendChild(settingsModalContent.cloneNode(true));

        // Tab switching
        const tabs = modal.querySelectorAll('.jsTLDR-tab');
        const contents = modal.querySelectorAll('.jsTLDR-tab-content');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('jsTLDR-active'));
                contents.forEach(c => c.classList.remove('jsTLDR-active'));
                tab.classList.add('jsTLDR-active');
                const contentId = tab.dataset.tab;
                modal.querySelector(`[data-content="${contentId}"]`).classList.add('jsTLDR-active');
            };
        });

        modal.querySelector('.jsTLDR-modal-close').onclick = closeModal;

        // Populate list contents
        renderPromptsList();
        renderChatbotsList();
        renderExclusionsList();

        // Add handlers for Add buttons
        modal.querySelector('#jsTLDR-add-prompt').onclick = () => showPromptForm();
        modal.querySelector('#jsTLDR-add-chatbot').onclick = () => showChatbotForm();
        modal.querySelector('#jsTLDR-add-exclusion').onclick = () => {
            const site = window.location.hostname.replace(/^www\./, '');
            const exclusions = getStored('excludedSites', []);
            if (!exclusions.includes(site)) {
                setStored('excludedSites', [...exclusions, site]);
                renderExclusionsList();
            }
        };

        // --- IMPORT/EXPORT HANDLERS START ---
        modal.querySelector('#jsTLDR-export-settings').onclick = exportSettings;
        modal.querySelector('#jsTLDR-import-settings').onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const content = JSON.parse(event.target.result);
                            importSettings(content);
                        } catch (error) {
                            alert("Error parsing JSON file: " + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        };
        // --- IMPORT/EXPORT HANDLERS END ---

        // --- HOTKEY INPUT HANDLER START ---
        modal.querySelector('#jsTLDR-hotkey-input').onchange = (e) => {
            setStored('hotkey', e.target.value.trim());
        };
        // --- HOTKEY INPUT HANDLER END ---
    }

    function renderPromptsList() {
        const container = modal.querySelector('#jsTLDR-prompts-list');
        if (!container) return; // Check if container exists in current modal instance
        const customPrompts = getStored('customPrompts', []);
        if (customPrompts.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No custom prompts yet</p>';
            return;
        }
        container.innerHTML = ''; // Clear previous content
        customPrompts.forEach((prompt, index) => {
            const item = document.createElement('div');
            item.className = 'jsTLDR-list-item';
            item.innerHTML = `
                <div class="jsTLDR-list-item-content">
                    <div class="jsTLDR-list-item-title">${prompt.name}</div>
                    <div class="jsTLDR-list-item-subtitle">${prompt.content.substring(0, 50)}...</div>
                </div>
                <div class="jsTLDR-list-item-actions">
                    <button class="jsTLDR-icon-button" data-action="up" data-index="${index}">↑</button> <!-- Added -->
                    <button class="jsTLDR-icon-button" data-action="down" data-index="${index}">↓</button> <!-- Added -->
                    <button class="jsTLDR-icon-button" data-action="edit" data-index="${index}">✏️</button>
                    <button class="jsTLDR-icon-button jsTLDR-danger" data-action="delete" data-index="${index}">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });

        // Attach handlers for reorder buttons
        container.querySelectorAll('[data-action="up"]').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                if (index > 0) {
                    const prompts = getStored('customPrompts', []);
                    [prompts[index - 1], prompts[index]] = [prompts[index], prompts[index - 1]];
                    setStored('customPrompts', prompts);
                    renderPromptsList(); // Refresh the list
                    renderPromptDropdown(); // Refresh dropdown
                }
            };
        });
        container.querySelectorAll('[data-action="down"]').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                const prompts = getStored('customPrompts', []);
                if (index < prompts.length - 1) {
                    [prompts[index], prompts[index + 1]] = [prompts[index + 1], prompts[index]];
                    setStored('customPrompts', prompts);
                    renderPromptsList(); // Refresh the list
                    renderPromptDropdown(); // Refresh dropdown
                }
            };
        });

        // Attach handlers for edit/delete buttons (existing logic)
        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                showPromptForm(customPrompts[index], index);
            };
        });
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = () => {
                if (confirm('Delete this prompt?')) {
                    const index = parseInt(btn.dataset.index);
                    const prompts = getStored('customPrompts', []);
                    prompts.splice(index, 1);
                    setStored('customPrompts', prompts);
                    renderPromptsList();
                    renderPromptDropdown();
                }
            };
        });
    }

    function renderChatbotsList() {
        const container = modal.querySelector('#jsTLDR-chatbots-list');
        if (!container) return; // Check if container exists in current modal instance
        const customChatbots = getStored('customChatbots', {});
        const botEntries = Object.entries(customChatbots);
        if (botEntries.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No custom chatbots yet</p>';
            return;
        }
        container.innerHTML = ''; // Clear previous content
        botEntries.forEach(([id, bot], index) => { // Use index for reordering
            const item = document.createElement('div');
            item.className = 'jsTLDR-list-item';
            item.innerHTML = `
                <div class="jsTLDR-list-item-content">
                    <div class="jsTLDR-list-item-title">${bot.name}</div>
                    <div class="jsTLDR-list-item-subtitle">${bot.url}</div>
                </div>
                <div class="jsTLDR-list-item-actions">
                    <button class="jsTLDR-icon-button" data-action="up" data-id="${id}">↑</button> <!-- Added -->
                    <button class="jsTLDR-icon-button" data-action="down" data-id="${id}">↓</button> <!-- Added -->
                    <button class="jsTLDR-icon-button" data-action="edit" data-id="${id}">✏️</button>
                    <button class="jsTLDR-icon-button jsTLDR-danger" data-action="delete" data-id="${id}">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });

        // Attach handlers for reorder buttons (using ID-based swap)
        container.querySelectorAll('[data-action="up"]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const bots = getStored('customChatbots', {});
                const botEntries = Object.entries(bots);
                const index = botEntries.findIndex(([entryId]) => entryId === id);
                if (index > 0) {
                    [botEntries[index - 1], botEntries[index]] = [botEntries[index], botEntries[index - 1]];
                    const reorderedBots = Object.fromEntries(botEntries);
                    setStored('customChatbots', reorderedBots);
                    renderChatbotsList(); // Refresh the list
                    renderBotDropdown(); // Refresh dropdown
                }
            };
        });
        container.querySelectorAll('[data-action="down"]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const bots = getStored('customChatbots', {});
                const botEntries = Object.entries(bots);
                const index = botEntries.findIndex(([entryId]) => entryId === id);
                if (index < botEntries.length - 1) {
                    [botEntries[index], botEntries[index + 1]] = [botEntries[index + 1], botEntries[index]];
                    const reorderedBots = Object.fromEntries(botEntries);
                    setStored('customChatbots', reorderedBots);
                    renderChatbotsList(); // Refresh the list
                    renderBotDropdown(); // Refresh dropdown
                }
            };
        });

        // Attach handlers for edit/delete buttons (existing logic)
        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.onclick = () => {
                const bot = customChatbots[btn.dataset.id];
                showChatbotForm(bot);
            };
        });
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = () => {
                if (confirm('Delete this chatbot?')) {
                    const bots = getStored('customChatbots', {});
                    delete bots[btn.dataset.id];
                    setStored('customChatbots', bots);
                    renderChatbotsList();
                    renderBotDropdown();
                }
            };
        });
    }

    function renderExclusionsList() {
        const container = modal.querySelector('#jsTLDR-exclusions-list');
        if (!container) return; // Check if container exists in current modal instance
        const exclusions = getStored('excludedSites', []);
        if (exclusions.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No excluded sites</p>';
            return;
        }
        container.innerHTML = ''; // Clear previous content
        exclusions.forEach((site, index) => {
            const item = document.createElement('div');
            item.className = 'jsTLDR-list-item';
            item.innerHTML = `
                <div class="jsTLDR-list-item-content">
                    <div class="jsTLDR-list-item-title">${site}</div>
                </div>
                <div class="jsTLDR-list-item-actions">
                    <button class="jsTLDR-icon-button jsTLDR-danger" data-action="delete" data-index="${index}">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                const exclusions = getStored('excludedSites', []);
                exclusions.splice(index, 1);
                setStored('excludedSites', exclusions);
                renderExclusionsList();
            };
        });
    }

    function showPromptForm(existingPrompt = null, editIndex = null) {
        const formHtml = `
            <div style="margin-top: 20px; padding: 20px; background: ${isDarkMode() ? '#2a2a2a' : '#f5f5f5'}; border-radius: 8px;">
                <h3 style="margin-top: 0; color: ${isDarkMode() ? '#fff' : '#000'};">${existingPrompt ? 'Edit' : 'Add'} Prompt</h3>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">Name</label>
                    <input type="text" class="jsTLDR-input" id="jsTLDR-prompt-name" value="${existingPrompt ? existingPrompt.name : ''}" placeholder="e.g., Quick Summary">
                </div>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">Content</label>
                    <textarea class="jsTLDR-textarea" id="jsTLDR-prompt-content" placeholder="Enter your prompt instructions...">${existingPrompt ? existingPrompt.content : ''}</textarea>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="jsTLDR-button" id="jsTLDR-save-prompt">Save</button>
                    <button class="jsTLDR-button jsTLDR-button-secondary" id="jsTLDR-cancel-prompt">Cancel</button>
                </div>
            </div>
        `;
        const container = modal.querySelector('#jsTLDR-prompts-list');
        container.insertAdjacentHTML('afterend', formHtml);
        modal.querySelector('#jsTLDR-add-prompt').style.display = 'none';
        modal.querySelector('#jsTLDR-save-prompt').onclick = () => {
            const name = modal.querySelector('#jsTLDR-prompt-name').value.trim();
            const content = modal.querySelector('#jsTLDR-prompt-content').value.trim();
            if (!name || !content) {
                alert('Please fill in all fields');
                return;
            }
            const customPrompts = getStored('customPrompts', []);
            const newPrompt = {
                id: existingPrompt ? existingPrompt.id : `custom_${Date.now()}`,
                name,
                content
            };
            if (editIndex !== null) {
                customPrompts[editIndex] = newPrompt;
            } else {
                customPrompts.push(newPrompt);
            }
            setStored('customPrompts', customPrompts);
            modal.querySelector('#jsTLDR-add-prompt').style.display = 'block';
            modal.querySelector('#jsTLDR-add-prompt').previousElementSibling.remove();
            renderPromptsList();
            renderPromptDropdown();
        };
        modal.querySelector('#jsTLDR-cancel-prompt').onclick = () => {
            modal.querySelector('#jsTLDR-add-prompt').style.display = 'block';
            modal.querySelector('#jsTLDR-add-prompt').previousElementSibling.remove();
        };
    }

    function showChatbotForm(existingBot = null) {
        const formHtml = `
            <div style="margin-top: 20px; padding: 20px; background: ${isDarkMode() ? '#2a2a2a' : '#f5f5f5'}; border-radius: 8px;">
                <h3 style="margin-top: 0; color: ${isDarkMode() ? '#fff' : '#000'};">${existingBot ? 'Edit' : 'Add'} Chatbot</h3>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">Name</label>
                    <input type="text" class="jsTLDR-input" id="jsTLDR-bot-name" value="${existingBot ? existingBot.name : ''}" placeholder="e.g., My Custom Bot">
                </div>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">URL</label>
                    <input type="text" class="jsTLDR-input" id="jsTLDR-bot-url" value="${existingBot ? existingBot.url : ''}" placeholder="https://...">
                </div>
                <div class="jsTLDR-form-group">
                    <label class="jsTLDR-label">Character Limit (optional)</label>
                    <input type="number" class="jsTLDR-input" id="jsTLDR-bot-limit" value="${existingBot ? existingBot.characterLimit || '' : ''}" placeholder="e.g., 50000">
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="jsTLDR-button" id="jsTLDR-save-bot">Save</button>
                    <button class="jsTLDR-button jsTLDR-button-secondary" id="jsTLDR-cancel-bot">Cancel</button>
                </div>
            </div>
        `;
        const container = modal.querySelector('#jsTLDR-chatbots-list');
        container.insertAdjacentHTML('afterend', formHtml);
        modal.querySelector('#jsTLDR-add-chatbot').style.display = 'none';
        modal.querySelector('#jsTLDR-save-bot').onclick = () => {
            const name = modal.querySelector('#jsTLDR-bot-name').value.trim();
            const url = modal.querySelector('#jsTLDR-bot-url').value.trim();
            const limit = modal.querySelector('#jsTLDR-bot-limit').value.trim();
            if (!name || !url) {
                alert('Please fill in name and URL');
                return;
            }
            const customBots = getStored('customChatbots', {});
            const botId = existingBot ? existingBot.id : `custom_${Date.now()}`;
            customBots[botId] = {
                id: botId,
                name,
                url,
                characterLimit: limit ? parseInt(limit) : 50000,
                premiumCharacterLimit: limit ? parseInt(limit) : 50000
            };
            setStored('customChatbots', customBots);
            modal.querySelector('#jsTLDR-add-chatbot').style.display = 'block';
            modal.querySelector('#jsTLDR-add-chatbot').previousElementSibling.remove();
            renderChatbotsList();
            renderBotDropdown();
        };
        modal.querySelector('#jsTLDR-cancel-bot').onclick = () => {
            modal.querySelector('#jsTLDR-add-chatbot').style.display = 'block';
            modal.querySelector('#jsTLDR-add-chatbot').previousElementSibling.remove();
        };
    }
    // --- SETTINGS MODAL DOM REUSE END ---


    // --- IMPORT/EXPORT SETTINGS START ---
    function exportSettings() {
        const settingsToExport = {
            selectedBotId: getStored('selectedBotId'),
            selectedPromptId: getStored('selectedPromptId'),
            excludedSites: getStored('excludedSites'),
            customChatbots: getStored('customChatbots'),
            customPrompts: getStored('customPrompts'),
            hotkey: getStored('hotkey'), // <-- ADDED
            positions: getStored('positions') // <-- ADDED
        };

        const dataStr = JSON.stringify(settingsToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'ai-summarizer-settings.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function importSettings(importedData) {
        if (confirm("Importing settings will overwrite your current custom prompts, chatbots, exclusions, selected items, hotkey, and positions. Continue?")) {
            setStored('selectedBotId', importedData.selectedBotId || 'chatgpt');
            setStored('selectedPromptId', importedData.selectedPromptId || 'summary');
            setStored('excludedSites', importedData.excludedSites || []);
            setStored('customChatbots', importedData.customChatbots || {});
            setStored('customPrompts', importedData.customPrompts || []);
            setStored('hotkey', importedData.hotkey || 'Ctrl+J'); // <-- ADDED
            setStored('positions', importedData.positions || {}); // <-- ADDED
            alert("Settings imported successfully! Please refresh the page to see changes.");
            location.reload(); // Reload to reflect changes, especially position
        }
    }
    // --- IMPORT/EXPORT SETTINGS END ---


    // Settings Button
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'jsTLDR-menu-button';
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.onclick = (e) => {
        e.stopPropagation();
        renderModal();
        modalOverlay.classList.add('jsTLDR-show');
        popupMenu.classList.remove('jsTLDR-show');
    };

    // Assemble UI
    popupMenu.appendChild(botBtn);
    popupMenu.appendChild(botDropdown);
    popupMenu.appendChild(promptBtn);
    popupMenu.appendChild(promptDropdown);
    popupMenu.appendChild(settingsBtn);
    container.appendChild(mainButton);
    container.appendChild(popupMenu);
    document.body.appendChild(container);
    document.body.appendChild(modalOverlay);

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#jsTLDR-container')) {
            botDropdown.classList.remove('jsTLDR-show');
            promptDropdown.classList.remove('jsTLDR-show');
        }
    });

    // --- HOTKEY LOGIC START ---
    document.addEventListener('keydown', e => {
        const hotkeyStr = getStored('hotkey', 'Ctrl+J').toLowerCase();
        const parts = hotkeyStr.split('+').map(p => p.trim());

        let expectedModifiers = { ctrl: false, shift: false, alt: false, meta: false };
        let expectedKey = '';

        parts.forEach(part => {
            switch(part.toLowerCase()) {
                case 'ctrl': expectedModifiers.ctrl = true; break;
                case 'shift': expectedModifiers.shift = true; break;
                case 'alt': expectedModifiers.alt = true; break;
                case 'meta': expectedModifiers.meta = true; break;
                default: expectedKey = part.toLowerCase();
            }
        });

        const actualModifiers = {
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
            meta: e.metaKey
        };

        const modifiersMatch = Object.keys(expectedModifiers).every(mod => actualModifiers[mod] === expectedModifiers[mod]);
        const keyMatch = e.key.toLowerCase() === expectedKey;

        if (modifiersMatch && keyMatch) {
            e.preventDefault();
            summarize();
        }
    });
    // --- HOTKEY LOGIC END ---

    // Check if current site is excluded
    const currentSite = window.location.hostname.replace(/^www\./, '');
    const excludedSites = getStored('excludedSites', []);
    if (excludedSites.includes(currentSite)) {
        container.remove();
    }

    // --- INITIALIZE TOOLTIP AND POSITION ---
    updateMainButtonTooltip(); // Set initial tooltip

})();
