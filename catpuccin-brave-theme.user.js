// ==UserScript==
// @name         Catppuccin Brave Search Theme
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Catppuccin theme for Brave Search with customizable settings
// @match        https://search.brave.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Catppuccin color palettes (previous palettes remain the same)
    // Catppuccin color palettes
    const catppuccin = {
        latte: {
            rosewater: '#dc8a78', flamingo: '#dd7878', pink: '#ea76cb', mauve: '#8839ef',
            red: '#d20f39', maroon: '#e64553', peach: '#fe640b', yellow: '#df8e1d',
            green: '#40a02b', teal: '#179299', sky: '#04a5e5', sapphire: '#209fb5',
            blue: '#1e66f5', lavender: '#7287fd', text: '#4c4f69', subtext1: '#5c5f77',
            subtext0: '#6c6f85', overlay2: '#7c7f93', overlay1: '#8c8fa1', overlay0: '#9ca0b0',
            surface2: '#acb0be', surface1: '#bcc0cc', surface0: '#ccd0da',
            base: '#eff1f5', mantle: '#e6e9ef', crust: '#dce0e8'
        },
        frappe: {
            rosewater: '#f2d5cf', flamingo: '#eebebe', pink: '#f4b8e4', mauve: '#ca9ee6',
            red: '#e78284', maroon: '#ea999c', peach: '#ef9f76', yellow: '#e5c890',
            green: '#a6d189', teal: '#81c8be', sky: '#99d1db', sapphire: '#85c1dc',
            blue: '#8caaee', lavender: '#babbf1', text: '#c6d0f5', subtext1: '#b5bfe2',
            subtext0: '#a5adce', overlay2: '#949cbb', overlay1: '#838ba7', overlay0: '#737994',
            surface2: '#626880', surface1: '#51576d', surface0: '#414559',
            base: '#303446', mantle: '#292c3c', crust: '#232634'
        },
        macchiato: {
            rosewater: '#f4dbd6', flamingo: '#f0c6c6', pink: '#f5bde6', mauve: '#c6a0f6',
            red: '#ed8796', maroon: '#ee99a0', peach: '#f5a97f', yellow: '#eed49f',
            green: '#a6da95', teal: '#8bd5ca', sky: '#91d7e3', sapphire: '#7dc4e4',
            blue: '#8aadf4', lavender: '#b7bdf8', text: '#cad3f5', subtext1: '#b8c0e0',
            subtext0: '#a5adcb', overlay2: '#939ab7', overlay1: '#8087a2', overlay0: '#6e738d',
            surface2: '#5b6078', surface1: '#494d64', surface0: '#363a4f',
            base: '#24273a', mantle: '#1e2030', crust: '#181926'
        },
        mocha: {
            rosewater: '#f5e0dc', flamingo: '#f2cdcd', pink: '#f5c2e7', mauve: '#cba6f7',
            red: '#f38ba8', maroon: '#eba0ac', peach: '#fab387', yellow: '#f9e2af',
            green: '#a6e3a1', teal: '#94e2d5', sky: '#89dceb', sapphire: '#74c7ec',
            blue: '#89b4fa', lavender: '#b4befe', text: '#cdd6f4', subtext1: '#bac2de',
            subtext0: '#a6adc8', overlay2: '#9399b2', overlay1: '#7f849c', overlay0: '#6c7086',
            surface2: '#585b70', surface1: '#45475a', surface0: '#313244',
            base: '#1e1e2e', mantle: '#181825', crust: '#11111b'
        }
    };

    // Default settings with saved preferences
    const defaultSettings = {
        lightFlavor: 'latte',
        darkFlavor: 'mocha',
        accentColor: 'mauve'
    };

    const settings = {
        get lightFlavor() { return GM_getValue('lightFlavor', defaultSettings.lightFlavor); },
        set lightFlavor(value) { GM_setValue('lightFlavor', value); },
        get darkFlavor() { return GM_getValue('darkFlavor', defaultSettings.darkFlavor); },
        set darkFlavor(value) { GM_setValue('darkFlavor', value); },
        get accentColor() { return GM_getValue('accentColor', defaultSettings.accentColor); },
        set accentColor(value) { GM_setValue('accentColor', value); }
    };

    // Flavor and accent color options
    const flavors = ['latte', 'frappe', 'macchiato', 'mocha'];
    const accentColors = [
        'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 
        'peach', 'yellow', 'green', 'teal', 'blue', 'sapphire', 
        'sky', 'lavender', 'subtext0'
    ];

    // Create floating menu styles
    GM_addStyle(`
        #catppuccin-menu {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-container-background, white);
            border: 1px solid var(--color-divider-subtle, #ccc);
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            color: var(--color-text-primary, black);
            max-width: 300px;
            width: 100%;
        }

        #catppuccin-menu h3 {
            margin: 0 0 10px 0;
            text-align: center;
            color: var(--color-text-interactive, black);
        }

        #catppuccin-menu .menu-section {
            margin-bottom: 15px;
        }

        #catppuccin-menu label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }

        #catppuccin-menu select {
            width: 100%;
            padding: 5px;
            margin-bottom: 10px;
            background: var(--color-serp-snippet-background, white);
            color: var(--color-text-primary, black);
            border: 1px solid var(--color-divider-subtle, #ccc);
            border-radius: 4px;
        }

        #catppuccin-menu-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-text-interactive, #007bff);
            color: var(--color-page-background, white);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10001;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        #catppuccin-menu-toggle:hover {
            opacity: 0.9;
        }

        .color-swatch {
            display: inline-block;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin: 0 2px;
            cursor: pointer;
            border: 2px solid transparent;
        }

        .color-swatch.selected {
            border-color: var(--color-text-interactive, black);
        }

        #accent-colors {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 5px;
        }
    `);

    // Create the floating menu
    function createMenu() {
        const menu = document.createElement('div');
        menu.id = 'catppuccin-menu';
        menu.style.display = 'none';

        menu.innerHTML = `
            <h3>Catppuccin Theme Settings</h3>
            
            <div class="menu-section">
                <label>Light Mode Flavor</label>
                <select id="light-flavor-select">
                    ${flavors.map(flavor => 
                        `<option value="${flavor}" ${settings.lightFlavor === flavor ? 'selected' : ''}>
                            ${flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                        </option>`
                    ).join('')}
                </select>
            </div>

            <div class="menu-section">
                <label>Dark Mode Flavor</label>
                <select id="dark-flavor-select">
                    ${flavors.map(flavor => 
                        `<option value="${flavor}" ${settings.darkFlavor === flavor ? 'selected' : ''}>
                            ${flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                        </option>`
                    ).join('')}
                </select>
            </div>

            <div class="menu-section">
                <label>Accent Color</label>
                <div id="accent-colors">
                    ${accentColors.map(color => {
                        const colorValue = Object.values(catppuccin.mocha).find(
                            (val, key) => key === color
                        );
                        return `
                            <div 
                                class="color-swatch ${settings.accentColor === color ? 'selected' : ''}" 
                                data-color="${color}" 
                                style="background-color: ${colorValue};"
                                title="${color.charAt(0).toUpperCase() + color.slice(1)}"
                            ></div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="menu-section" style="text-align: center;">
                <button id="save-settings">Save Settings</button>
            </div>
        `;

        document.body.appendChild(menu);

        // Toggle menu button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'catppuccin-menu-toggle';
        toggleButton.innerHTML = '🎨';
        document.body.appendChild(toggleButton);

        // Event listeners
        toggleButton.addEventListener('click', () => {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });

        // Accent color selection
        const accentColorSwatches = menu.querySelectorAll('.color-swatch');
        accentColorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                accentColorSwatches.forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
            });
        });

        // Save settings
        const saveButton = menu.querySelector('#save-settings');
        saveButton.addEventListener('click', () => {
            // Get selected values
            const lightFlavor = document.getElementById('light-flavor-select').value;
            const darkFlavor = document.getElementById('dark-flavor-select').value;
            const accentColor = menu.querySelector('.color-swatch.selected').dataset.color;

            // Save settings
            settings.lightFlavor = lightFlavor;
            settings.darkFlavor = darkFlavor;
            settings.accentColor = accentColor;

            // Reapply theme
            init();

            // Hide menu
            menu.style.display = 'none';
        });
    }

    function darkenColor(hex, amount) {
        const num = parseInt(hex.slice(1), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) - amt;
        const G = ((num >> 8) & 0x00ff) - amt;
        const B = (num & 0x0000ff) - amt;
        return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
    }

    function hexToRGBA(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function applyTheme(flavor, accentColor) {
        const palette = catppuccin[flavor];
        const accentColorValue = palette[accentColor];

        const style = document.createElement('style');
        style.textContent = `
            :root {
                color-scheme: ${flavor === 'latte' ? 'light' : 'dark'};

                --color-page-background: ${palette.base};
                --color-container-background: ${palette.crust};
                --color-container-highlight: ${palette.mantle};
                --color-serp-header-background: ${palette.crust};
                --color-text-interactive: ${accentColorValue};
                --color-divider-subtle: ${palette.surface0};
                --color-divider-interactive: ${accentColorValue};
                --color-text-primary: ${palette.text};
                --color-serp-bar-bg: ${palette.mantle};
                --color-serp-divider-subtle-container: ${palette.surface0};
                --color-gray-30: ${palette.subtext0};
                --color-gray-40: ${palette.overlay2};
                --color-text-secondary: ${palette.subtext1};
                --color-text-tertiary: ${palette.subtext0};
                --color-icon-default: ${palette.overlay2};
                --color-serp-snippet-background: ${palette.base};
                --color-link-default: ${palette.blue};
                --color-link-visited: ${palette.mauve};
                --color-tabs-search-text-default: ${accentColorValue};
                --color-primary-50: ${accentColorValue};
                --color-primitive-primary-60: ${accentColorValue};
                --color-primitive-primary-70: ${darkenColor(accentColorValue, 0.05)};
                --color-container-interactive: transparent;
                --color-button-background: ${accentColorValue};
                --color-button-disabled: ${hexToRGBA(palette.surface2, 0.3)};
                --color-serp-settings-background: ${palette.mantle};
            }

            ::selection {
                background-color: ${hexToRGBA(accentColorValue, 0.3)};
            }

            input, textarea {
                &::placeholder {
                    color: ${palette.subtext0} !important;
                }
            }

            dialog {
                color: ${palette.text};
            }

            dialog::backdrop {
                background-color: ${hexToRGBA(palette.crust, 0.3)};
            }

            #searchform::after {
                outline-color: ${palette.surface0};
            }

            #searchform-actions::before {
                background: none !important;
            }

            #submit-button:hover:not(:disabled) {
                background: linear-gradient(
                    314deg,
                    ${palette.peach} 8.49%,
                    ${palette.pink} 43.72%,
                    ${palette.mauve} 99.51%
                );
            }

            #submit-button svg {
                fill: ${palette.overlay2};
            }

            #searchbox::placeholder {
                color: ${palette.subtext0};
            }

            .button.type--filled.theme--default {
                color: ${palette.base};
            }

            .button.type--filled.theme--default:disabled {
                color: ${hexToRGBA(palette.text, 0.5)};
            }

            .button.type--outlined.theme--default:hover {
                background-color: ${accentColorValue};
                border-color: ${accentColorValue} !important;
                color: ${palette.base} !important;
            }

            .tab-item.active .icon {
                fill: ${accentColorValue} !important;
            }

            .tab-item.active::after {
                background: ${accentColorValue} !important;
            }

            input[type="radio"]:checked::after {
                background-color: ${accentColorValue};
            }
        `;

        document.head.appendChild(style);
    }

    function detectColorScheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        return prefersDark.matches ? settings.darkFlavor : settings.lightFlavor;
    }

    function init() {
        const currentFlavor = document.documentElement.classList.contains('light') ? settings.lightFlavor
            : document.documentElement.classList.contains('dark') ? settings.darkFlavor
            : detectColorScheme();

        applyTheme(currentFlavor, settings.accentColor);
    }

    // Create menu when script loads
    createMenu();

    // Run the theme when the page loads
    init();
})();