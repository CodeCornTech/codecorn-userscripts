// ==UserScript==
// @name         CodeCorn Console Capture (God Mode v4.14.0)
// @namespace    https://codecorn.it/
// @version      4.14.0
// @description  Log, Spy, Power Tools, Global Settings & Inspector! Fully Typed, Trusted Types Compliant.
// @match        *://*/*
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
// --- AMBIENT DECLARATIONS PER VS CODE ---
/* global html2canvas, GM_getValue, GM_setValue, GM_setClipboard, GM_info, unsafeWindow */
/* @ts-ignore */
const _GM_getValue = /* @ts-ignore */ typeof GM_getValue !== 'undefined' ? GM_getValue : null;
const _GM_setValue = /* @ts-ignore */ typeof GM_setValue !== 'undefined' ? GM_setValue : null;
const _GM_setClipboard = /* @ts-ignore */ typeof GM_setClipboard !== 'undefined' ? GM_setClipboard : null;
const _GM_info = /* @ts-ignore */ typeof GM_info !== 'undefined' ? GM_info : null;
const _unsafeWindow = /* @ts-ignore */ typeof unsafeWindow !== 'undefined' ? unsafeWindow : null;
const _html2canvas = /* @ts-ignore */ typeof html2canvas !== 'undefined' ? html2canvas : null;

/**
 * @typedef {Window & typeof globalThis & { ccCopy?: function(any): any, html2canvas?: any, cccg?: any, frameworkOverlayLoaded?: boolean }} TargetWindow
 * @typedef {{ selector: string, stopUI: boolean, stopTools: boolean }} ExclusionPreset
 */

(() => {
    'use strict';

    if (window.location.hostname.includes('chatgpt.com')) return;

    // --- 0. PRESET DI ESCLUSIONE (SMART SMART HARDENING PER WORDPRESS CUSTOMIZER & SIMILI) ---
    /** @type {Object<string, ExclusionPreset>} */
    const EXCLUSION_PRESETS = {
        wpCustomizerControls: {
            selector: '#customize-controls, .wp-full-overlay-sidebar, #sub-accordion-panel-widgets',
            stopUI: true, // Impedisce il rendering della toolbar in questo specifico contenitore
            stopTools: true, // Blocca Inspector, Thanos, Sniffer e Monitor per non rompere i controlli nativi
        },
        wpAdminBar: {
            selector: '#wpadminbar',
            stopUI: false,
            stopTools: true, // Evita di distruggere o ispezionare accidentalmente la topbar di WP
        },
    };

    /**
     * Controlla se un elemento o uno dei suoi genitori fa parte di un preset di esclusione attivo
     * @param {HTMLElement|null} el
     * @param {keyof ExclusionPreset} actionKey
     * @returns {boolean}
     */
    function matchesExclusionPreset(el, actionKey) {
        if (!el) return false;
        for (const key in EXCLUSION_PRESETS) {
            const preset = EXCLUSION_PRESETS[key];
            if (preset[actionKey]) {
                if (el.matches(preset.selector) || el.closest(preset.selector)) {
                    return true;
                }
            }
        }
        return false;
    }

    // --- 0. SETTINGS MANAGEMENT (CROSS-SITE) ---
    const STORAGE_KEY = '__cc_console_capture_logs_v4__';
    const SETTINGS_KEY = '__cc_godmode_settings_global__';
    const MAX_DEPTH = 15;

    /** @type {Object<string, any>} */
    const defaultSettings = {
        gap: 6,
        edgeOffset: 10,
        autoHide: false,
        autoHideMs: 3000,
        autoShowMs: 400,
        hoverZone: 40,
        maxLogs: 1500,
        blockClear: false,
        networkSpy: true,
        toolbarPosIdx: 0,
        toolbarVisible: true,
        iframePropagation: true, // Nuova impostazione: se true propaga X-Ray e tool negli iframe (es. customize-preview)
    };

    let userSettings = { ...defaultSettings };
    try {
        const savedRaw = _GM_getValue ? _GM_getValue(SETTINGS_KEY, null) : window.localStorage.getItem(SETTINGS_KEY);
        if (savedRaw) {
            const saved = JSON.parse(savedRaw);
            userSettings = { ...defaultSettings, ...saved };
        }
    } catch (e) {}

    function saveSettings() {
        try {
            if (_GM_setValue) {
                _GM_setValue(SETTINGS_KEY, JSON.stringify(userSettings));
            } else {
                window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));
            }
        } catch (e) {}
    }

    // Hotkeys
    const HOTKEYS = {
        CURRENT: { ctrlKey: true, shiftKey: true, code: 'KeyX' },
        HISTORY: { ctrlKey: true, shiftKey: true, code: 'KeyH' },
        TOGGLE: { ctrlKey: true, shiftKey: true, code: 'KeyB' },
        SCREEN: { ctrlKey: true, shiftKey: true, code: 'KeyS' },
        ELEM: { ctrlKey: true, shiftKey: true, code: 'KeyE' },
        XRAY: { ctrlKey: true, shiftKey: true, code: 'KeyL' },
        POS: { ctrlKey: true, shiftKey: true, code: 'KeyM' },
        HELP: { ctrlKey: true, shiftKey: true, code: 'KeyI' },
        INJECT: { ctrlKey: true, shiftKey: true, code: 'KeyJ' },
        TOOLS: { ctrlKey: true, shiftKey: true, code: 'KeyO' },
    };

    /** @type {Array<Object>} */
    const currentSessionLogs = [];
    /** @type {TargetWindow} */
    const targetWindow = _unsafeWindow ? /** @type {TargetWindow} */ (_unsafeWindow) : /** @type {TargetWindow} */ (window);

    const targetConsole = targetWindow.console;

    // --- 1. CORE LOGGING ---
    const originalConsole = {
        log: targetConsole.log.bind(targetConsole),
        info: targetConsole.info.bind(targetConsole),
        warn: targetConsole.warn.bind(targetConsole),
        error: targetConsole.error.bind(targetConsole),
        debug: targetConsole.debug ? targetConsole.debug.bind(targetConsole) : targetConsole.log.bind(targetConsole),
        clear: targetConsole.clear ? targetConsole.clear.bind(targetConsole) : null,
    };

    /**
     * Stampa un log formattato CodeCorn
     * @param {string} msg
     */
    function ccLog(msg) {
        const d = new Date();
        /** * @param {number} n
         * @returns {string}
         */
        const pad = (n) => {
            return n.toString().padStart(2, '0');
        };
        const timestamp = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        originalConsole.info(`%c Code %c Corn %c [${timestamp}] ${msg}`, 'background: #ffd700; color: #000; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: 900; font-family: sans-serif;', 'background: #000; color: #ffd700; padding: 4px 8px; border-radius: 0 4px 4px 0; font-weight: 900; font-family: sans-serif;', 'color: #94a3b8; font-family: monospace; font-size: 13px; margin-left: 8px;');
    }

    /** @returns {Array<Object>} */
    function loadHistoryLogs() {
        try {
            return JSON.parse(targetWindow.localStorage.getItem(STORAGE_KEY) || '[]') || [];
        } catch {
            return [];
        }
    }

    /** @param {Array<Object>} logs */
    function saveHistoryLogs(logs) {
        try {
            targetWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-userSettings.maxLogs)));
        } catch (e) {
            originalConsole.warn('[CC] History save failed', e);
        }
    }

    /** @param {any} val @returns {boolean} */
    function isPlainObject(val) {
        return Object.prototype.toString.call(val) === '[object Object]';
    }

    /**
     * Serializza in modo sicuro i dati per l'esportazione JSON (anti-circolare)
     * @param {any} value
     * @param {number} [depth=0]
     * @param {WeakSet<any>} [seen=new WeakSet()]
     * @returns {any}
     */
    function serializeValue(value, depth = 0, seen = new WeakSet()) {
        if (depth > MAX_DEPTH) return '[MaxDepth]';
        if (value === null || typeof value === 'undefined') return String(value);
        if (typeof value !== 'object' && typeof value !== 'function') return typeof value === 'bigint' ? `${value}n` : value;
        if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
        if (value instanceof Error) return { type: 'Error', name: value.name, message: value.message };
        if (value instanceof Date) return value.toISOString();
        if (typeof targetWindow.HTMLElement !== 'undefined' && value instanceof targetWindow.HTMLElement) return `[DOM Element: ${value.tagName}]`;

        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        if (Array.isArray(value)) {
            return value.map((item) => {
                return serializeValue(item, depth + 1, seen);
            });
        }

        /** @type {Object<string, any>} */
        const output = {};
        for (const key of isPlainObject(value) ? Object.keys(value) : Object.getOwnPropertyNames(value)) {
            try {
                output[key] = serializeValue(value[key], depth + 1, seen);
            } catch (e) {
                output[key] = '[Error]';
            }
        }
        return output;
    }

    /**
     * Inserisce la voce nei log di sessione e history
     * @param {string} method
     * @param {any[]} args
     */
    function pushEntry(method, args) {
        const entry = {
            ts: new Date().toISOString(),
            url: targetWindow.location.href,
            method,
            args: Array.from(args).map((arg) => {
                return serializeValue(arg);
            }),
        };
        currentSessionLogs.push(entry);
        const hist = loadHistoryLogs();
        hist.push(entry);
        saveHistoryLogs(hist);
    }

    ['log', 'info', 'warn', 'error', 'debug'].forEach((method) => {
        /** @type {any} */
        const consoleMethod = /** @type {any} */ (targetConsole)[method];
        if (consoleMethod) {
            /** @param {any[]} args */
            const newFn = (...args) => {
                pushEntry(method, args);
                /** @type {Function} */ (/** @type {any} */ (originalConsole)[method]).apply(originalConsole, args);
            };
            /** @type {any} */ (targetConsole)[method] = newFn;
        }
    });

    if (targetConsole.clear) {
        /** @param {any[]} args */
        targetConsole.clear = (...args) => {
            if (userSettings.blockClear) {
                ccLog('🛡️ Console.clear() bloccato dal God Mode.');
                pushEntry('clear_blocked', args);
                return;
            }
            pushEntry('clear', args);
            if (originalConsole.clear) /** @type {Function} */ (originalConsole.clear).apply(originalConsole, args);
        };
    }

    /**
     * Mostra un toast popup
     * @param {string} message
     * @param {boolean} [isError=false]
     */
    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: ${isError ? '#dc2626' : '#16a34a'}; color: white;
            padding: 10px 20px; border-radius: 8px; font-family: monospace; font-size: 14px;
            z-index: 2147483647; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: opacity 0.3s; pointer-events: none;
        `;
        document.documentElement.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2500);
    }

    // --- 2. NETWORK SPY ---
    const origFetch = targetWindow.fetch;
    /** @param {any[]} args */
    targetWindow.fetch = async (...args) => {
        if (userSettings.networkSpy) pushEntry('fetch (req)', args);
        try {
            const res = await /** @type {Function} */ (origFetch).apply(targetWindow, args);
            if (userSettings.networkSpy) pushEntry('fetch (res)', [{ url: res.url, status: res.status }]);
            return res;
        } catch (e) {
            if (userSettings.networkSpy) pushEntry('fetch (err)', [e]);
            throw e;
        }
    };

    const origXhrOpen = targetWindow.XMLHttpRequest.prototype.open;
    /** @param {any[]} args */
    targetWindow.XMLHttpRequest.prototype.open = function (...args) {
        /** @type {any} */ (this)._cc_url = args[1];
        return origXhrOpen.apply(this, /** @type {any} */ (args));
    };

    const origXhrSend = targetWindow.XMLHttpRequest.prototype.send;
    /** @param {any[]} args */
    targetWindow.XMLHttpRequest.prototype.send = function (...args) {
        if (userSettings.networkSpy) {
            pushEntry('xhr (req)', [/** @type {any} */ (this)._cc_url, args[0]]);
            this.addEventListener('load', () => {
                pushEntry('xhr (res)', [{ url: /** @type {any} */ (this)._cc_url, status: this.status }]);
            });
        }
        return origXhrSend.apply(this, /** @type {any} */ (args));
    };

    // --- 3. EXPORT HELPERS & GLOBAL COPY ---
    /**
     * @param {any} data
     * @param {string} label
     */
    function executeCopy(data, label) {
        const text = JSON.stringify(
            {
                exportedAt: new Date().toISOString(),
                url: targetWindow.location.href,
                type: label,
                data,
            },
            null,
            2,
        );
        try {
            if (_GM_setClipboard) {
                _GM_setClipboard(text, 'text');
                showToast(`✅ [${label}] Copiato!`);
            } else {
                throw new Error('GM_setClipboard missing');
            }
        } catch (e) {
            navigator.clipboard
                .writeText(text)
                .then(() => {
                    showToast(`✅ [${label}] Copiato!`);
                })
                .catch(() => {
                    showToast(`❌ Errore copia`, true);
                    originalConsole.error(text);
                });
        }
    }

    const copyCurrentLogs = () => {
        executeCopy(currentSessionLogs, 'Current Console');
    };
    const copyHistoryLogs = () => {
        executeCopy(loadHistoryLogs(), 'Full History');
    };
    const exportStateDump = () => {
        executeCopy(
            {
                localStorage: { ...localStorage },
                sessionStorage: { ...sessionStorage },
                cookie: document.cookie,
            },
            'State Dump',
        );
    };

    /**
     * @param {any} data
     * @returns {any}
     */
    targetWindow.ccCopy = function (data) {
        const serialized = serializeValue(data);
        const text = typeof serialized === 'object' ? JSON.stringify(serialized, null, 2) : String(serialized);
        try {
            if (_GM_setClipboard) {
                _GM_setClipboard(text, 'text');
                showToast(`✅ Dato copiato in clipboard!`);
            } else {
                throw new Error('GM missing');
            }
        } catch (e) {
            navigator.clipboard
                .writeText(text)
                .then(() => {
                    showToast(`✅ Dato copiato in clipboard!`);
                })
                .catch(() => {
                    showToast(`❌ Errore copia clipboard`, true);
                    originalConsole.error(text);
                });
        }
        ccLog('📝 Eseguito ccCopy(). Guarda la clipboard.');
        originalConsole.log(data);
        return data;
    };

    /** @returns {string} */
    const getTs = () => {
        const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
        /** @param {number} n @returns {string} */
        const p = (n) => {
            return n.toString().padStart(2, '0');
        };
        return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    };

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {string} prefix
     */
    const downloadCanvas = (canvas, prefix) => {
        const link = document.createElement('a');
        link.download = `${prefix}_${getTs()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showToast(`📸 ${link.download}`);
    };

    async function takeFullScreenshot() {
        if (!_html2canvas) return showToast('❌ html2canvas non caricato', true);
        showToast('📸 Screenshot in corso...');
        try {
            const canvas = await _html2canvas(document.body, {
                useCORS: true,
                logging: false,
            });
            downloadCanvas(canvas, 'screenshot');
        } catch (e) {
            showToast('❌ Errore Screenshot', true);
        }
    }

    // --- 4. MODES (INSPECTOR MULTI-SELECT, THANOS, SNIFFER, MONITOR) ---
    let currentMode = 'none';
    /** @type {HTMLElement|null} */ let overlay = null;
    /** @type {HTMLElement|null} */ let tooltip = null;
    /** @type {HTMLElement|null} */ let hoveredEl = null;

    // --- Nuove Variabili per Inspector Multi-Select ---
    /** @type {HTMLElement[]} */
    let selectedNodes = [];
    /** @type {HTMLElement|null} */
    let lcaNode = null;
    /** @type {HTMLElement[]} */
    let tempOverlays = [];

    function cleanupMode() {
        currentMode = 'none';
        if (overlay) overlay.remove();
        if (tooltip) tooltip.remove();
        tempOverlays.forEach((o) => {
            o.remove();
        });
        tempOverlays = [];
        selectedNodes = [];
        lcaNode = null;
        document.removeEventListener('mousemove', handleHover);
        document.removeEventListener('click', handleClick, { capture: true });
    }

    /**
     * @param {string} mode
     * @param {string} msg
     */
    function initMode(mode, msg) {
        if (currentMode !== 'none') cleanupMode();
        currentMode = mode;

        let bg = 'rgba(14, 165, 233, 0.2)',
            border = '#0ea5e9'; // Default Inspector (Azzurro)
        if (mode === 'thanos') {
            bg = 'rgba(239, 68, 68, 0.2)';
            border = '#ef4444';
        }
        if (mode === 'sniffer') {
            bg = 'rgba(217, 70, 239, 0.2)';
            border = '#d946ef';
        }
        if (mode === 'monitor') {
            bg = 'rgba(245, 158, 11, 0.2)';
            border = '#f59e0b';
        }

        if (mode === 'inspector') msg += ' (Tieni premuto SHIFT per multi-selezione/area)';
        showToast(msg);

        overlay = document.createElement('div');
        overlay.style.cssText = `position: fixed; pointer-events: none; z-index: 2147483645; transition: all 0.05s linear; background: ${bg}; outline: 2px solid ${border};`;
        tooltip = document.createElement('div');
        tooltip.style.cssText = `position: fixed; background: #0f172a; color: #fff; padding: 6px 10px; border-radius: 4px; font-family: monospace; font-size: 12px; z-index: 2147483646; pointer-events: none; border: 1px solid #334155; display: none; white-space: pre-wrap;`;

        document.body.appendChild(overlay);
        document.body.appendChild(tooltip);
        document.addEventListener('mousemove', handleHover);
        document.addEventListener('click', handleClick, { capture: true });
    }

    /**
     * Helper: Trova l'antenato comune più basso (LCA) di un array di Nodi
     * @param {HTMLElement[]} nodes
     * @returns {HTMLElement|null}
     */
    function findLowestCommonAncestor(nodes) {
        if (!nodes || nodes.length === 0) return null;
        if (nodes.length === 1) return nodes[0];

        /** @type {HTMLElement[]} */
        const ancestors = [];
        let curr = /** @type {HTMLElement|null} */ (nodes[0]);
        while (curr) {
            ancestors.push(curr);
            curr = curr.parentElement;
        }

        for (let ancestor of ancestors) {
            let isCommon = true;
            for (let i = 1; i < nodes.length; i++) {
                if (!ancestor.contains(nodes[i])) {
                    isCommon = false;
                    break;
                }
            }
            if (isCommon) return ancestor;
        }
        return document.body;
    }

    /**
     * Crea un overlay temporaneo per la selezione
     * @param {DOMRect} rect
     */
    function createTempOverlay(rect) {
        const o = document.createElement('div');
        o.style.cssText = `position: fixed; pointer-events: none; z-index: 2147483644; background: rgba(250, 204, 21, 0.3); outline: 1px dashed #facc15; top: ${rect.top}px; left: ${rect.left}px; width: ${rect.width}px; height: ${rect.height}px;`;
        document.body.appendChild(o);
        tempOverlays.push(o);
    }

    /**
     * Trusted Types DOM Builder helper per evitare innerHTML dove possibile
     * @param {HTMLElement} parent
     * @param {string} tag
     * @param {string} text
     * @param {string} [color]
     * @returns {HTMLElement}
     */
    function appendSpan(parent, tag, text, color) {
        const span = document.createElement('span');
        if (color) span.style.color = color;
        span.textContent = text;
        parent.appendChild(span);
        return span;
    }

    /** @param {MouseEvent} e */
    function handleHover(e) {
        /** @type {HTMLElement|null} */
        const target = /** @type {HTMLElement} */ (e.target);

        // --- HARDENING CRITICO CONTRO I PRESET DI ESCLUSIONE (Evita crash o ispezioni sui pannelli WP Customizer e Topbar) ---
        if (target && (target.closest('#__cc_sidebar__') || target.closest('#__cc_backdrop__') || target === document.body || target === document.documentElement || matchesExclusionPreset(target, 'stopTools'))) {
            if (selectedNodes.length === 0 && overlay && tooltip) {
                overlay.style.display = 'none';
                tooltip.style.display = 'none';
            }
            hoveredEl = null;
            return;
        }

        hoveredEl = target;

        let targetToHighlight = target;
        let isMulti = false;

        if (currentMode === 'inspector' && selectedNodes.length > 0 && target) {
            const tempNodes = [...selectedNodes, target];
            targetToHighlight = /** @type {HTMLElement} */ (findLowestCommonAncestor(tempNodes) || target);
            isMulti = true;
        }

        if (targetToHighlight && overlay && tooltip) {
            const rect = targetToHighlight.getBoundingClientRect();

            if (isMulti) {
                overlay.style.background = 'rgba(34, 197, 94, 0.2)';
                overlay.style.outline = '2px solid #22c55e';
            } else if (currentMode === 'inspector') {
                overlay.style.background = 'rgba(14, 165, 233, 0.2)';
                overlay.style.outline = '2px solid #0ea5e9';
            }

            overlay.style.display = 'block';
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
            overlay.style.top = `${rect.top}px`;
            overlay.style.left = `${rect.left}px`;

            tooltip.style.display = 'block';
            tooltip.style.top = `${e.clientY + 15}px`;
            tooltip.style.left = `${e.clientX + 15}px`;

            // Ricostruiamo il Tooltip con DOM elements invece di innerHTML
            tooltip.textContent = ''; // Svuota
            appendSpan(tooltip, 'span', targetToHighlight.tagName.toLowerCase(), '#f43f5e');
            if (targetToHighlight.id) {
                appendSpan(tooltip, 'span', `#${targetToHighlight.id}`, '#38bdf8');
            }
            if (targetToHighlight.className) {
                appendSpan(tooltip, 'span', `.${targetToHighlight.className.replace(/ /g, '.')}`, '#a3e635');
            }
            tooltip.appendChild(document.createElement('br'));
            appendSpan(tooltip, 'span', `${Math.round(rect.width)}x${Math.round(rect.height)}`, '#94a3b8');

            if (isMulti) {
                tooltip.appendChild(document.createElement('br'));
                appendSpan(tooltip, 'span', `📦 Area Contenitore (Elementi: ${selectedNodes.length + 1})`, '#fbbf24');
                tooltip.appendChild(document.createElement('br'));
                const hint = appendSpan(tooltip, 'span', `(Rilascia SHIFT e clicca per catturare)`, '#cbd5e1');
                hint.style.fontSize = '10px';
            }
        }
    }

    /** @param {MouseEvent} e */
    async function handleClick(e) {
        const target = hoveredEl || /** @type {HTMLElement} */ (e.target);

        // Se l'elemento appartiene a un'area bloccata, lascia passare l'evento originale senza catturarlo
        if (target && matchesExclusionPreset(target, 'stopTools')) return;

        e.preventDefault();
        e.stopPropagation();

        const modeAtClick = currentMode;

        if (!target || target === document.body) {
            cleanupMode();
            return;
        }

        if (modeAtClick === 'inspector') {
            if (e.shiftKey) {
                if (!selectedNodes.includes(target)) {
                    selectedNodes.push(target);
                    createTempOverlay(target.getBoundingClientRect());
                    showToast(`📍 Elemento aggiunto (${selectedNodes.length}). Continua o rilascia SHIFT.`);
                }
                return;
            } else {
                let finalTarget = target;
                if (selectedNodes.length > 0) {
                    selectedNodes.push(target);
                    finalTarget = /** @type {HTMLElement} */ (findLowestCommonAncestor(selectedNodes) || target);
                }

                cleanupMode();
                showToast(selectedNodes.length > 0 ? '📸 Cattura Area Multipla...' : '📸 Cattura elemento singolo...');

                try {
                    if (!_html2canvas) throw new Error('html2canvas err');
                    const canvas = await _html2canvas(finalTarget, {
                        useCORS: true,
                        logging: false,
                        backgroundColor: null,
                    });
                    downloadCanvas(canvas, selectedNodes.length > 0 ? 'area_multipla' : 'element');
                } catch (err) {
                    showToast('❌ Errore cattura', true);
                    originalConsole.error(err);
                }
                return;
            }
        }

        cleanupMode();

        if (modeAtClick === 'thanos') {
            target.remove();
            showToast('💥 Elemento distrutto!');
        } else if (modeAtClick === 'sniffer') {
            const css = window.getComputedStyle(target);
            const props = ['color', 'background-color', 'font-family', 'font-size', 'font-weight', 'line-height', 'padding', 'margin', 'display', 'width', 'height', 'border', 'border-radius', 'box-shadow'];
            /** @type {Object<string, string>} */
            let result = {
                element: target.tagName.toLowerCase(),
                id: target.id,
                class: target.className,
            };
            props.forEach((p) => {
                const val = css.getPropertyValue(p);
                if (val && val !== 'none' && val !== '0px') result[p] = val;
            });
            if (targetWindow.ccCopy) targetWindow.ccCopy(result);
        } else if (modeAtClick === 'monitor') {
            const id = target.id ? `#${target.id}` : target.className ? `.${target.className.split(' ')[0]}` : `<${target.tagName.toLowerCase()}>`;
            ['click', 'input', 'change', 'keydown', 'focus', 'blur'].forEach((ev) => {
                target.addEventListener(ev, (evt) => {
                    const eventTarget = /** @type {HTMLInputElement} */ (evt.target);
                    ccLog(`🎧 Monitor [${ev}]: ${id} -> Valore: ${eventTarget.value || 'N/A'}`);
                    pushEntry('event_monitor', [{ event: ev, target: id, value: eventTarget.value }]);
                });
            });
            showToast(`🎧 Monitor avviato su ${id}`);
        }
    }

    /** @param {KeyboardEvent} e */
    function handleEsc(e) {
        if (e.key === 'Escape') cleanupMode();
    }
    const toggleInspector = () => {
        return currentMode === 'inspector' ? cleanupMode() : initMode('inspector', '🔍 Clicca per fotografare');
    };
    const toggleThanos = () => {
        return currentMode === 'thanos' ? cleanupMode() : initMode('thanos', '💥 Seleziona per distruggere (Esc annulla)');
    };
    const toggleSniffer = () => {
        return currentMode === 'sniffer' ? cleanupMode() : initMode('sniffer', '🎨 Seleziona elemento per copiare il CSS (Esc annulla)');
    };
    const toggleMonitor = () => {
        return currentMode === 'monitor' ? cleanupMode() : initMode('monitor', '🎧 Seleziona elemento da monitorare (Esc annulla)');
    };

    // --- 5. POWER TOOLS LOGIC ---
    let xrayActive = false;
    function toggleXRay() {
        xrayActive = !xrayActive;
        let style = document.getElementById('__cc_xray__');
        if (xrayActive) {
            if (!style) {
                style = document.createElement('style');
                style.id = '__cc_xray__';
                // Escludiamo esplicitamente dalla sovrascrittura di X-Ray le classi e id di controllo WP
                style.textContent = `* { outline: 1px solid rgba(255, 0, 0, 0.4) !important; background: rgba(0, 0, 0, 0.02) !important; }
                                     #customize-controls *, .wp-full-overlay-sidebar *, #wpadminbar * { outline: none !important; background: transparent !important; }`;
                document.head.appendChild(style);
            }
            showToast('🩻 X-Ray Attivato');
        } else {
            if (style) style.remove();
            showToast('🩻 X-Ray Disattivato');
        }
    }

    let seoActive = false;
    function toggleSEO() {
        seoActive = !seoActive;
        let style = document.getElementById('__cc_seo__');
        if (seoActive) {
            if (!style) {
                style = document.createElement('style');
                style.id = '__cc_seo__';
                style.textContent = `
                    h1 { outline: 4px solid #16a34a !important; background: rgba(22, 163, 74, 0.2) !important; }
                    h2 { outline: 3px solid #84cc16 !important; background: rgba(132, 204, 22, 0.2) !important; }
                    img:not([alt]), img[alt=""] { outline: 4px dashed #dc2626 !important; filter: sepia(1) hue-rotate(300deg) saturate(100) !important; }
                    a[href="#"], a:not([href]) { outline: 3px dotted #9333ea !important; background: rgba(147, 51, 234, 0.2) !important; }
                `;
                document.head.appendChild(style);
            }
            showToast('🕷️ SEO/A11y Scanner Attivato');
        } else {
            if (style) style.remove();
            showToast('🕷️ SEO/A11y Scanner Disattivato');
        }
    }

    function nukeSession() {
        if (!confirm('☢️ ATTENZIONE! Vuoi piallare LocalStorage, SessionStorage, Cookie e ricaricare la pagina?')) return;
        window.localStorage.clear();
        window.sessionStorage.clear();
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });
        ccLog('☢️ Nuke Session completato. Ricaricamento...');
        window.location.reload();
    }

    function harvestAssets() {
        /** @type {{images: string[], videos: string[], audio: string[]}} */
        let assets = { images: [], videos: [], audio: [] };
        document.querySelectorAll('img, picture source').forEach((el) => {
            const imgEl = /** @type {HTMLImageElement|HTMLSourceElement} */ (el);
            let s = imgEl.src || imgEl.srcset;
            if (s && s.startsWith('http')) assets.images.push(s);
        });
        document.querySelectorAll('video, video source').forEach((el) => {
            const vidEl = /** @type {HTMLVideoElement|HTMLSourceElement} */ (el);
            let s = vidEl.src;
            if (s && s.startsWith('http')) assets.videos.push(s);
        });
        document.querySelectorAll('audio, audio source').forEach((el) => {
            const audEl = /** @type {HTMLAudioElement|HTMLSourceElement} */ (el);
            let s = audEl.src;
            if (s && s.startsWith('http')) assets.audio.push(s);
        });
        assets.images = [...new Set(assets.images)];
        assets.videos = [...new Set(assets.videos)];
        assets.audio = [...new Set(assets.audio)];
        if (targetWindow.ccCopy) targetWindow.ccCopy(assets);
    }

    let hudActive = false;
    /** @type {HTMLElement|null} */ let hudEl = null;
    let hudFrames = 0;
    let hudLastTime = performance.now();

    function toggleHUD() {
        hudActive = !hudActive;
        if (hudActive) {
            hudEl = document.createElement('div');
            hudEl.style.cssText = `position: fixed; top: 10px; right: 10px; background: rgba(15, 23, 42, 0.85); color: #38bdf8; padding: 12px 15px; border-radius: 8px; font-family: monospace; z-index: 2147483647; pointer-events: none; border: 1px solid #334155; font-size: 13px; line-height: 1.5; backdrop-filter: blur(4px); box-shadow: 0 4px 15px rgba(0,0,0,0.5);`;
            document.body.appendChild(hudEl);
            function updateHUD() {
                if (!hudActive) return;
                hudFrames++;
                let now = performance.now();
                if (now - hudLastTime >= 1000) {
                    let fps = Math.round((hudFrames * 1000) / (now - hudLastTime));
                    hudFrames = 0;
                    hudLastTime = now;
                    let nodes = document.querySelectorAll('*').length;
                    const perf = /** @type {any} */ (performance);
                    let ram = perf.memory ? (perf.memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB' : 'N/A';
                    if (hudEl) {
                        // DOM builder al posto di innerHTML per Trusted Types
                        hudEl.textContent = '';
                        appendSpan(hudEl, 'span', 'FPS: ', '#a3e635');
                        hudEl.appendChild(document.createTextNode(`${fps} `));
                        hudEl.appendChild(document.createElement('br'));
                        appendSpan(hudEl, 'span', 'DOM: ', '#fbbf24');
                        hudEl.appendChild(document.createTextNode(`${nodes} nodi `));
                        hudEl.appendChild(document.createElement('br'));
                        appendSpan(hudEl, 'span', 'RAM: ', '#c084fc');
                        hudEl.appendChild(document.createTextNode(ram));
                    }
                }
                requestAnimationFrame(updateHUD);
            }
            updateHUD();
            showToast('📊 HUD Performance Attivato');
        } else {
            if (hudEl) hudEl.remove();
            showToast('📊 HUD Performance Disattivato');
        }
    }

    // --- 6. UI, ANIMATIONS, AUTO-SHOW ---
    const POSITIONS = ['left', 'top', 'right', 'bottom'];
    let currentPosIdx = userSettings.toolbarPosIdx;
    /** @type {any} */ let autoHideTimer = null;
    /** @type {any} */ let autoShowTimer = null;
    let isSidebarVisible = userSettings.toolbarVisible;

    /** @param {HTMLElement|null} sb */
    function applyCurrentPosition(sb) {
        if (!sb) return;
        const pos = POSITIONS[currentPosIdx];
        const offset = `${userSettings.edgeOffset}px`;

        sb.style.left = '';
        sb.style.right = '';
        sb.style.top = '';
        sb.style.bottom = '';
        let baseTransform = '';
        switch (pos) {
            case 'left':
                sb.style.left = offset;
                sb.style.top = '50%';
                baseTransform = 'translateY(-50%)';
                sb.style.flexDirection = 'column';
                break;
            case 'top':
                sb.style.top = offset;
                sb.style.left = '50%';
                baseTransform = 'translateX(-50%)';
                sb.style.flexDirection = 'row';
                break;
            case 'right':
                sb.style.right = offset;
                sb.style.top = '50%';
                baseTransform = 'translateY(-50%)';
                sb.style.flexDirection = 'column';
                break;
            case 'bottom':
                sb.style.bottom = offset;
                sb.style.left = '50%';
                baseTransform = 'translateX(-50%)';
                sb.style.flexDirection = 'row';
                break;
        }
        sb.dataset.baseTransform = baseTransform;
        sb.dataset.pos = pos;

        if (isSidebarVisible) {
            sb.style.transform = baseTransform;
            sb.style.opacity = '1';
            sb.style.pointerEvents = 'auto';
            sb.style.filter = 'blur(0px)';
        } else {
            sb.style.transform = `${baseTransform} scale(0.85)`;
            sb.style.opacity = '0';
            sb.style.pointerEvents = 'none';
            sb.style.filter = 'blur(4px)';
        }
    }

    /** @param {boolean} visible */
    function setSidebarVisible(visible) {
        const sb = document.getElementById('__cc_sidebar__');
        if (!sb) return;
        isSidebarVisible = visible;
        userSettings.toolbarVisible = visible;
        saveSettings();
        applyCurrentPosition(sb);
    }

    /** @param {HTMLElement} [sidebarEl] */
    function applyToolbarSettings(sidebarEl) {
        const sb = sidebarEl || document.getElementById('__cc_sidebar__');
        if (!sb) return;
        sb.style.gap = `${userSettings.gap}px`;
        applyCurrentPosition(sb);
    }

    function startAutoHide() {
        clearTimeout(autoHideTimer);
        const modal = document.getElementById('__cc_backdrop__');
        if (userSettings.autoHide && isSidebarVisible && !modal) {
            autoHideTimer = setTimeout(() => {
                setSidebarVisible(false);
            }, userSettings.autoHideMs);
        }
    }

    document.addEventListener('mousemove', (e) => {
        if (isSidebarVisible || !userSettings.autoHide) {
            if (autoShowTimer) {
                clearTimeout(autoShowTimer);
                autoShowTimer = null;
            }
            return;
        }
        const pos = POSITIONS[currentPosIdx];
        const threshold = userSettings.hoverZone;
        let inZone = false;
        switch (pos) {
            case 'left':
                inZone = e.clientX <= threshold;
                break;
            case 'right':
                inZone = e.clientX >= window.innerWidth - threshold;
                break;
            case 'top':
                inZone = e.clientY <= threshold;
                break;
            case 'bottom':
                inZone = e.clientY >= window.innerHeight - threshold;
                break;
        }
        if (inZone) {
            if (!autoShowTimer) {
                autoShowTimer = setTimeout(() => {
                    setSidebarVisible(true);
                    startAutoHide();
                }, userSettings.autoShowMs);
            }
        } else {
            if (autoShowTimer) {
                clearTimeout(autoShowTimer);
                autoShowTimer = null;
            }
        }
    });

    function toggleUI() {
        setSidebarVisible(!isSidebarVisible);
        showToast(isSidebarVisible ? '👀 Toolbar mostrata' : '🙈 Toolbar nascosta');
        if (isSidebarVisible) startAutoHide();
    }

    function moveToolbar() {
        if (!isSidebarVisible) return showToast('⚠️ La toolbar deve essere visibile per spostarla!', true);
        currentPosIdx = (currentPosIdx + 1) % POSITIONS.length;
        userSettings.toolbarPosIdx = currentPosIdx;
        saveSettings();
        applyCurrentPosition(document.getElementById('__cc_sidebar__'));
        showToast(`🔀 Toolbar a: ${POSITIONS[currentPosIdx].toUpperCase()}`);
        startAutoHide();
    }

    // --- 6. MODALS (Trusted Types Refactor) ---
    /** @returns {HTMLElement} */
    function createBackdrop() {
        const bd = document.createElement('div');
        bd.id = '__cc_backdrop__';
        bd.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(6px); z-index: 2147483646; display: flex; align-items: center; justify-content: center;`;
        return bd;
    }

    function closeModals() {
        const bd = document.getElementById('__cc_backdrop__');
        if (bd) bd.remove();
        startAutoHide();
    }

    /**
     * @param {string} title
     * @param {HTMLElement} contentNode
     * @param {Function} [onReady]
     * @param {string} [customWidth]
     */
    function openNodeModal(title, contentNode, onReady, customWidth = '380px') {
        if (document.getElementById('__cc_backdrop__')) return closeModals();
        clearTimeout(autoHideTimer);
        const bd = createBackdrop();
        bd.onclick = (e) => {
            if (e.target === bd) closeModals();
        };
        const modal = document.createElement('div');
        modal.style.cssText = `background: #0f172a; color: #f8fafc; padding: 25px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); font-family: system-ui, sans-serif; min-width: ${customWidth}; max-width: 90vw; max-height: 90vh; overflow-y: auto; border: 1px solid #334155; cursor: default; display: flex; flex-direction: column; gap: 15px;`;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: ${customWidth === '750px' ? '15px' : '0'};`;

        const h2 = document.createElement('h2');
        h2.style.cssText = `margin: 0; font-size: 18px; color: #ffd700;`;
        h2.textContent = title;

        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `background: none; border: none; color: #ef4444; font-size: 24px; cursor: pointer; padding: 0; line-height: 1;`;
        closeBtn.textContent = '×';
        closeBtn.onclick = closeModals;

        header.appendChild(h2);
        header.appendChild(closeBtn);
        modal.appendChild(header);
        modal.appendChild(contentNode);

        bd.appendChild(modal);
        document.body.appendChild(bd);

        if (onReady) onReady(modal);
    }

    /**
     * Helper per creare label con input all'interno
     * @param {string} text
     * @param {HTMLElement} inputEl
     * @param {string} [title]
     */
    function createLabelRow(text, inputEl, title) {
        const label = document.createElement('label');
        label.style.cssText = `display: flex; justify-content: space-between; align-items: center;`;
        if (title) label.title = title;
        label.appendChild(document.createTextNode(text));
        label.appendChild(inputEl);
        return label;
    }

    function toggleHelpModal() {
        const container = document.createElement('div');
        container.style.cssText = `display: grid; grid-template-columns: 1fr 1fr; gap: 30px;`;

        // COLONNA SINISTRA
        const leftCol = document.createElement('div');
        leftCol.style.cssText = `display: flex; flex-direction: column; gap: 20px;`;

        // Shortcuts
        const shortWrap = document.createElement('div');
        const h3Short = document.createElement('h3');
        h3Short.style.cssText = `margin: 0 0 10px 0; font-size: 14px; color: #10b981;`;
        h3Short.textContent = '⌨️ Shortcuts';
        shortWrap.appendChild(h3Short);

        const shortGrid = document.createElement('div');
        shortGrid.style.cssText = `display: grid; grid-template-columns: auto 1fr; gap: 6px 15px; font-size: 13px; line-height: 1.4;`;

        const shortcuts = [
            { key: 'Ctrl+Shift+X', desc: 'Copia Current Console', color: '#38bdf8' },
            { key: 'Ctrl+Shift+H', desc: 'Copia Full History', color: '#38bdf8' },
            { key: 'Ctrl+Shift+B', desc: 'Visibilità Toolbar', color: '#a3e635' },
            { key: 'Ctrl+Shift+M', desc: 'Sposta Toolbar', color: '#a3e635' },
            { key: 'Ctrl+Shift+S', desc: 'Full Screenshot', color: '#fbbf24' },
            { key: 'Ctrl+Shift+E', desc: 'Inspector Elemento', color: '#c084fc' },
            { key: 'Ctrl+Shift+L', desc: 'X-Ray Layout', color: '#f87171' },
            { key: 'Ctrl+Shift+J', desc: 'Live Injector', color: '#10b981' },
            { key: 'Ctrl+Shift+O', desc: 'Apre Power Tools', color: '#8b5cf6' },
            { key: 'Esc', desc: 'Chiude Modals / Disattiva Tool', color: '#ef4444' },
        ];

        shortcuts.forEach((s) => {
            const b = document.createElement('b');
            b.style.color = s.color;
            b.textContent = s.key;
            const span = document.createElement('span');
            span.textContent = s.desc;
            shortGrid.appendChild(b);
            shortGrid.appendChild(span);
        });
        shortWrap.appendChild(shortGrid);
        leftCol.appendChild(shortWrap);

        // AIC
        const apiWrap = document.createElement('div');
        apiWrap.style.cssText = `border-top: 1px dashed #334155; padding-top: 15px;`;
        const h3Api = document.createElement('h3');
        h3Api.style.cssText = `margin: 0 0 10px 0; font-size: 14px; color: #10b981;`;
        h3Api.textContent = '🛠️ API Globali';
        apiWrap.appendChild(h3Api);

        const apiFlex = document.createElement('div');
        apiFlex.style.cssText = `display: flex; flex-direction: column; gap: 6px; font-size: 13px;`;

        const api1 = document.createElement('span');
        const code1 = document.createElement('code');
        code1.style.color = '#fbbf24';
        code1.textContent = 'ccCopy(data)';
        api1.appendChild(code1);
        api1.appendChild(document.createTextNode(' - Copia oggetto/array in clipboard.'));

        const api2 = document.createElement('span');
        const code2 = document.createElement('code');
        code2.style.color = '#fbbf24';
        code2.textContent = 'cccg';
        api2.appendChild(code2);
        api2.appendChild(document.createTextNode(" - Oggetto globale dell'estensione."));

        apiFlex.appendChild(api1);
        apiFlex.appendChild(api2);
        apiWrap.appendChild(apiFlex);
        leftCol.appendChild(apiWrap);

        container.appendChild(leftCol);

        // COLONNA DESTRA
        const rightCol = document.createElement('div');
        rightCol.style.cssText = `display: flex; flex-direction: column; gap: 20px;`;

        // Visive
        const visWrap = document.createElement('div');
        const h3Vis = document.createElement('h3');
        h3Vis.style.cssText = `margin: 0 0 10px 0; font-size: 14px; color: #10b981;`;
        h3Vis.textContent = '⚙️ Impostazioni Barra & Sotto-Frame';
        visWrap.appendChild(h3Vis);

        const visFlex = document.createElement('div');
        visFlex.style.cssText = `display: flex; flex-direction: column; gap: 10px; font-size: 13px;`;

        /**
         * @param {string} id
         * @param {number} val
         * @param {number|null} min
         * @param {number|null} max
         * @param {number|null} step
         * @returns {HTMLInputElement}
         */
        const createNumInput = (id, val, min, max, step) => {
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.id = id;
            inp.value = val.toString();
            if (min !== null) inp.min = min.toString();
            if (max !== null) inp.max = max.toString();
            if (step !== null) inp.step = step.toString();
            inp.style.cssText = `width: 60px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px; padding:2px 5px;`;
            return inp;
        };

        /**
         * @param {string} id
         * @param {boolean} checked
         * @returns {HTMLInputElement}
         */
        const createCbInput = (id, checked) => {
            const inp = document.createElement('input');
            inp.type = 'checkbox';
            inp.id = id;
            inp.checked = checked;
            return inp;
        };

        visFlex.appendChild(createLabelRow('Distanza bordo (px): ', createNumInput('cc_cfg_edge', userSettings.edgeOffset, 0, 100, null)));
        visFlex.appendChild(createLabelRow('Toolbar Gap (px): ', createNumInput('cc_cfg_gap', userSettings.gap, 0, 30, null)));
        visFlex.appendChild(createLabelRow('Auto-Hide Toolbar: ', createCbInput('cc_cfg_autohide', userSettings.autoHide)));

        const autoMsInp = createNumInput('cc_cfg_automs', userSettings.autoHideMs, null, null, 500);
        autoMsInp.style.width = '70px';
        visFlex.appendChild(createLabelRow('Auto-Hide (ms): ', autoMsInp));

        const showMsInp = createNumInput('cc_cfg_showms', userSettings.autoShowMs, null, null, 100);
        showMsInp.style.width = '70px';
        visFlex.appendChild(createLabelRow('Auto-Show (ms): ', showMsInp, 'Millisecondi di hover per mostrare la barra'));

        visFlex.appendChild(createLabelRow('Hitbox (px): ', createNumInput('cc_cfg_zone', userSettings.hoverZone, null, null, 5), 'Profondità dal bordo per auto-show'));
        visFlex.appendChild(createLabelRow('Deep Frame X-Ray/Tools: ', createCbInput('cc_cfg_iframe', userSettings.iframePropagation), "Inietta i tool interattivi all'interno dei sotto-iframe (es. Anteprime WP Customizer)"));

        visWrap.appendChild(visFlex);
        rightCol.appendChild(visWrap);

        // Sistema
        const sysWrap = document.createElement('div');
        sysWrap.style.cssText = `border-top: 1px dashed #334155; padding-top: 15px;`;
        const h3Sys = document.createElement('h3');
        h3Sys.style.cssText = `margin: 0 0 10px 0; font-size: 14px; color: #10b981;`;
        h3Sys.textContent = '🛡️ Sistema';
        sysWrap.appendChild(h3Sys);

        const sysFlex = document.createElement('div');
        sysFlex.style.cssText = `display: flex; flex-direction: column; gap: 10px; font-size: 13px;`;
        sysFlex.appendChild(createLabelRow('Blocca console.clear(): ', createCbInput('cc_cfg_blockclear', userSettings.blockClear), 'Impedisce ai siti di usare console.clear()'));
        sysFlex.appendChild(createLabelRow('Network Spy (Fetch/XHR): ', createCbInput('cc_cfg_netspy', userSettings.networkSpy), 'Logga richieste Fetch e XHR'));

        const maxLogInp = createNumInput('cc_cfg_maxlogs', userSettings.maxLogs, null, null, 500);
        maxLogInp.style.width = '70px';
        sysFlex.appendChild(createLabelRow('Max Log History: ', maxLogInp));

        sysWrap.appendChild(sysFlex);
        rightCol.appendChild(sysWrap);

        container.appendChild(rightCol);

        openNodeModal(
            '🌽 God Mode Settings',
            container,
            () => {
                /**
                 * @param {string} id
                 * @param {string} key
                 * @param {boolean} [isCb=false]
                 */
                const bindSetting = (id, key, isCb = false) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    el.onchange = (e) => {
                        const target = /** @type {HTMLInputElement} */ (e.target);
                        userSettings[key] = isCb ? target.checked : parseInt(target.value, 10);
                        saveSettings();
                        applyToolbarSettings();
                        if (key === 'autoHide') {
                            if (userSettings.autoHide) startAutoHide();
                            else {
                                clearTimeout(autoHideTimer);
                                setSidebarVisible(true);
                            }
                        } else if (key === 'autoHideMs') {
                            startAutoHide();
                        }
                    };
                };
                bindSetting('cc_cfg_edge', 'edgeOffset');
                bindSetting('cc_cfg_gap', 'gap');
                bindSetting('cc_cfg_autohide', 'autoHide', true);
                bindSetting('cc_cfg_automs', 'autoHideMs');
                bindSetting('cc_cfg_showms', 'autoShowMs');
                bindSetting('cc_cfg_zone', 'hoverZone');
                bindSetting('cc_cfg_iframe', 'iframePropagation', true);
                bindSetting('cc_cfg_blockclear', 'blockClear', true);
                bindSetting('cc_cfg_netspy', 'networkSpy', true);
                bindSetting('cc_cfg_maxlogs', 'maxLogs');
            },
            '750px',
        );
    }

    function toggleInjectorModal() {
        const container = document.createElement('div');
        container.style.cssText = `display: flex; flex-direction: column; gap: 15px;`;

        const radioWrap = document.createElement('div');
        radioWrap.style.cssText = `display: flex; gap: 10px;`;

        const lblCss = document.createElement('label');
        lblCss.style.cssText = `cursor:pointer; display:flex; align-items:center; gap:5px;`;
        const radCss = document.createElement('input');
        radCss.type = 'radio';
        radCss.name = 'cc_inj_type';
        radCss.value = 'css';
        radCss.checked = true;
        lblCss.appendChild(radCss);
        lblCss.appendChild(document.createTextNode(' CSS'));

        const lblJs = document.createElement('label');
        lblJs.style.cssText = `cursor:pointer; display:flex; align-items:center; gap:5px;`;
        const radJs = document.createElement('input');
        radJs.type = 'radio';
        radJs.name = 'cc_inj_type';
        radJs.value = 'js';
        lblJs.appendChild(radJs);
        lblJs.appendChild(document.createTextNode(' JS'));

        radioWrap.appendChild(lblCss);
        radioWrap.appendChild(lblJs);
        container.appendChild(radioWrap);

        const textarea = document.createElement('textarea');
        textarea.id = '__cc_inj_code__';
        textarea.spellcheck = false;
        textarea.placeholder = '/* Incolla il codice qui... */';
        textarea.style.cssText = `width: 100%; height: 250px; background: #1e293b; color: #e2e8f0; border: 1px solid #475569; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 13px; resize: vertical; box-sizing: border-box; outline: none;`;
        container.appendChild(textarea);

        const btnRun = document.createElement('button');
        btnRun.id = '__cc_run_inj__';
        btnRun.textContent = '⚡ INIETTA CODICE';
        btnRun.style.cssText = `background: #10b981; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; transition: 0.2s;`;
        container.appendChild(btnRun);

        openNodeModal(
            '💉 Live Injector',
            container,
            () => {
                const ta = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('__cc_inj_code__'));

                if (ta) {
                    ta.addEventListener('keydown', function (e) {
                        /** @type {HTMLTextAreaElement} */
                        const el = this;
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            const start = el.selectionStart;
                            const end = el.selectionEnd;
                            const spaces = '    ';
                            el.value = el.value.substring(0, start) + spaces + el.value.substring(end);
                            el.selectionStart = el.selectionEnd = start + spaces.length;
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            const start = el.selectionStart;
                            const currentLine = el.value.substring(0, start).split('\n').pop() || '';
                            const match = currentLine.match(/^\s*/);
                            const spaces = match ? match[0] : '';
                            el.value = el.value.substring(0, start) + '\n' + spaces + el.value.substring(el.selectionEnd);
                            el.selectionStart = el.selectionEnd = start + 1 + spaces.length;
                        }
                    });
                }

                const btn = document.getElementById('__cc_run_inj__');
                if (btn) {
                    btn.onmouseover = () => {
                        btn.style.background = '#059669';
                    };
                    btn.onmouseout = () => {
                        btn.style.background = '#10b981';
                    };
                    btn.onclick = () => {
                        const radio = /** @type {HTMLInputElement|null} */ (document.querySelector('input[name="cc_inj_type"]:checked'));
                        const type = radio ? radio.value : 'js';
                        const code = ta ? ta.value.trim() : '';

                        if (!code) return showToast('⚠️ Inserisci del codice!', true);

                        if (type === 'css') {
                            const style = document.createElement('style');
                            style.textContent = code;
                            document.head.appendChild(style);
                            showToast('🎨 CSS Iniettato!');
                            closeModals();
                        } else {
                            try {
                                const fn = new Function(code);
                                fn();
                                showToast('⚙️ JS Eseguito!');
                                closeModals();
                            } catch (err) {
                                originalConsole.error('[CC Injector]', err);
                                showToast('❌ Errore JS', true);
                            }
                        }
                    };
                }
            },
            '500px',
        );
    }

    function togglePowerToolsModal() {
        const btnCSS = `width:100%; text-align:left; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:8px; cursor:pointer; font-size:14px; transition:0.2s; display:flex; align-items:center; gap:10px; font-family:system-ui, sans-serif;`;

        const container = document.createElement('div');
        const grid = document.createElement('div');
        grid.style.cssText = `display:grid; grid-template-columns: 1fr 1fr; gap:10px;`;

        /**
         * @param {string} id
         * @param {string} icon
         * @param {string} text
         */
        const createPTBtn = (id, icon, text) => {
            const b = document.createElement('button');
            b.id = id;
            b.style.cssText = btnCSS;
            b.textContent = `${icon} ${text}`;
            grid.appendChild(b);
        };

        createPTBtn('pt_nuke', '☢️', 'Nuke Session');
        createPTBtn('pt_hud', '📊', 'Toggle HUD Info');
        createPTBtn('pt_asset', '🧲', 'Asset Harvester');
        createPTBtn('pt_sniffer', '🎨', 'Design Sniffer');
        createPTBtn('pt_seo', '🕷️', 'Toggle SEO Scanner');
        createPTBtn('pt_monitor', '🎧', 'Event Monitor');

        container.appendChild(grid);

        const footer = document.createElement('div');
        footer.style.cssText = `margin-top:10px; font-size:12px; color:#94a3b8; text-align:center;`;
        footer.textContent = 'I Tool interattivi (Sniffer, Monitor) si chiudono cliccando su un elemento o premendo Esc.';
        container.appendChild(footer);

        openNodeModal(
            '🛠️ Power Tools',
            container,
            () => {
                /**
                 * @param {string} id
                 * @param {string} hoverCol
                 * @param {Function} action
                 */
                const bindPT = (id, hoverCol, action) => {
                    const b = document.getElementById(id);
                    if (b) {
                        b.onmouseover = () => {
                            b.style.background = hoverCol;
                        };
                        b.onmouseout = () => {
                            b.style.background = '#1e293b';
                        };
                        b.onclick = () => {
                            action();
                            if (['pt_sniffer', 'pt_monitor'].includes(id)) closeModals();
                        };
                    }
                };
                bindPT('pt_nuke', '#ef4444', nukeSession);
                bindPT('pt_hud', '#38bdf8', toggleHUD);
                bindPT('pt_asset', '#8b5cf6', harvestAssets);
                bindPT('pt_sniffer', '#d946ef', toggleSniffer);
                bindPT('pt_seo', '#10b981', toggleSEO);
                bindPT('pt_monitor', '#f59e0b', toggleMonitor);
            },
            '400px',
        );
    }

    // --- 7. EXPOSE GLOBALS ---
    targetWindow.cccg = {
        help: toggleHelpModal,
        injector: toggleInjectorModal,
        tools: togglePowerToolsModal,
        toggleUI: toggleUI,
        moveUI: moveToolbar,
        copyCurrent: copyCurrentLogs,
        copyHistory: copyHistoryLogs,
        copyData: targetWindow.ccCopy,
        screenshot: takeFullScreenshot,
        inspector: toggleInspector,
        thanos: toggleThanos,
        xray: toggleXRay,
        dump: exportStateDump,
        version: '4.14.0',
        settings: userSettings,
    };
    // --- 7.5 SELF CHECK VERSIONING E HEALTH ---
    if (_GM_info && _GM_info.script) {
        const headerVer = _GM_info.script.version;
        if (headerVer !== targetWindow.cccg.version) {
            originalConsole.warn(`%c [CodeCorn] WARNING: Disallineamento Versione! %c Header TM: ${headerVer} | Core JS: ${targetWindow.cccg.version}`, 'background: #dc2626; color: white; padding: 2px 5px; border-radius: 4px;', 'color: #dc2626; font-weight: bold;');
        }
    }
    // --- 8. INITIALIZATION & LISTENERS ---
    window.addEventListener(
        'keydown',
        (e) => {
            // Global Escape Listener
            if (e.key === 'Escape') {
                if (currentMode !== 'none') cleanupMode();
                if (document.getElementById('__cc_backdrop__')) closeModals();
                return;
            }

            if (!e.ctrlKey || !e.shiftKey) return;
            switch (e.code) {
                case HOTKEYS.CURRENT.code:
                    e.preventDefault();
                    copyCurrentLogs();
                    break;
                case HOTKEYS.HISTORY.code:
                    e.preventDefault();
                    copyHistoryLogs();
                    break;
                case HOTKEYS.TOGGLE.code:
                    e.preventDefault();
                    toggleUI();
                    break;
                case HOTKEYS.SCREEN.code:
                    e.preventDefault();
                    takeFullScreenshot();
                    break;
                case HOTKEYS.ELEM.code:
                    e.preventDefault();
                    toggleInspector();
                    break;
                case HOTKEYS.XRAY.code:
                    e.preventDefault();
                    toggleXRay();
                    break;
                case HOTKEYS.POS.code:
                    e.preventDefault();
                    moveToolbar();
                    break;
                case HOTKEYS.HELP.code:
                    e.preventDefault();
                    toggleHelpModal();
                    break;
                case HOTKEYS.INJECT.code:
                    e.preventDefault();
                    toggleInjectorModal();
                    break;
                case HOTKEYS.TOOLS.code:
                    e.preventDefault();
                    togglePowerToolsModal();
                    break;
            }
        },
        true,
    );

    // Se l'opzione iframePropagation è disattivata e non siamo nel top frame, blocchiamo l'esecuzione della UI qui
    if (window !== window.top && !userSettings.iframePropagation) {
        return;
    }

    window.addEventListener('DOMContentLoaded', () => {
        // HARDENING CONTRO WP CUSTOMIZER CONTROLS: Se la pagina corrente o l'elemento body appartiene alla barra laterale dei controlli, esci
        if (matchesExclusionPreset(document.body, 'stopUI') || (window.location.pathname.includes('customize.php') && !targetWindow.frameworkOverlayLoaded)) {
            // Se siamo nel frame principale dei comandi nativi, iniettiamo solo le logiche ma non renderizziamo la barra visiva
            return;
        }

        const styleNode = document.createElement('style');
        styleNode.textContent = `
                .__cc-btn { height: 40px; min-width: 40px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: flex-start; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4); transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); overflow: hidden; padding: 0 10px; box-sizing: border-box; outline: none; }
                .__cc-btn-icon { font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center; min-width: 20px; }
                .__cc-btn-text { max-width: 0; opacity: 0; font-size: 13px; font-weight: 600; font-family: system-ui, sans-serif; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); white-space: nowrap; pointer-events: none; }
                @media (min-width: 768px) {
                    /* Orizzontale (Top/Bottom): Si allarga solo il bottone hoverato */
                    #__cc_sidebar__[data-pos="top"] .__cc-btn:hover,
                    #__cc_sidebar__[data-pos="bottom"] .__cc-btn:hover { padding-right: 15px; }
                    #__cc_sidebar__[data-pos="top"] .__cc-btn:hover .__cc-btn-text,
                    #__cc_sidebar__[data-pos="bottom"] .__cc-btn:hover .__cc-btn-text { max-width: 200px; opacity: 1; margin-left: 8px; }

                    /* Verticale (Left/Right): Si allargano TUTTI i bottoni al passaggio sulla sidebar */
                    #__cc_sidebar__[data-pos="left"]:hover .__cc-btn,
                    #__cc_sidebar__[data-pos="right"]:hover .__cc-btn { padding-right: 15px; }
                    #__cc_sidebar__[data-pos="left"]:hover .__cc-btn .__cc-btn-text,
                    #__cc_sidebar__[data-pos="right"]:hover .__cc-btn .__cc-btn-text { max-width: 200px; opacity: 1; margin-left: 8px; }
                }
            `;
        document.head.appendChild(styleNode);

        const sidebar = document.createElement('div');
        sidebar.id = '__cc_sidebar__';
        sidebar.style.cssText = `position: fixed; display: flex; z-index: 2147483645; font-family: system-ui, sans-serif; transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s ease;`;
        applyToolbarSettings(sidebar);

        sidebar.addEventListener('mouseenter', () => {
            clearTimeout(autoHideTimer);
        });
        sidebar.addEventListener('mouseleave', startAutoHide);

        /**
         * @param {string} icon
         * @param {string} title
         * @param {string} hoverCol
         * @param {(e?: Event) => void} action
         * @returns {HTMLButtonElement}
         */
        const createBtn = (icon, title, hoverCol, action) => {
            const btn = document.createElement('button');
            btn.className = '__cc-btn';
            btn.title = title;
            const label = title.split(' (')[0];

            // Trusted Types safe construction
            const dIcon = document.createElement('div');
            dIcon.className = '__cc-btn-icon';
            dIcon.textContent = icon;

            const dText = document.createElement('div');
            dText.className = '__cc-btn-text';
            dText.textContent = label;

            btn.appendChild(dIcon);
            btn.appendChild(dText);

            btn.onmouseover = () => {
                btn.style.background = hoverCol;
            };
            btn.onmouseout = () => {
                btn.style.background = '#0f172a';
            };
            btn.onclick = action;
            return btn;
        };

        sidebar.appendChild(createBtn('📋', 'Current Console (Ctrl+Shift+X)', '#1e293b', copyCurrentLogs));
        sidebar.appendChild(createBtn('📜', 'Full History (Ctrl+Shift+H)', '#0369a1', copyHistoryLogs));
        sidebar.appendChild(createBtn('📦', 'State Dump (Storage)', '#16a34a', exportStateDump));
        sidebar.appendChild(createBtn('📷', 'Screenshot (Ctrl+Shift+S)', '#ca8a04', takeFullScreenshot));
        sidebar.appendChild(createBtn('🎯', 'Element Inspector (Ctrl+Shift+E)', '#7e22ce', toggleInspector));
        sidebar.appendChild(createBtn('💥', 'Thanos Snap', '#dc2626', toggleThanos));
        sidebar.appendChild(createBtn('🩻', 'X-Ray Layout (Ctrl+Shift+L)', '#475569', toggleXRay));
        sidebar.appendChild(createBtn('💉', 'Live Injector (Ctrl+Shift+J)', '#10b981', toggleInjectorModal));
        sidebar.appendChild(createBtn('🛠️', 'Power Tools (Ctrl+Shift+O)', '#8b5cf6', togglePowerToolsModal));
        sidebar.appendChild(createBtn('⚙️', 'Settings & Shortcuts (Ctrl+Shift+I)', '#0ea5e9', toggleHelpModal));

        document.documentElement.appendChild(sidebar);
        startAutoHide();
    });

    ccLog('God Mode v4.14.0 Inizializzato! 🚀 (Trusted Types Compliant & WP Customizer Fixed)');
})();

/*
================================================================================
📝 NOTA: Come funziona ccCopy(data)
================================================================================
La funzione ccCopy() è esposta globalmente nell'oggetto window.

Se nel Live Injector o direttamente nella console del browser scrivi:

ccCopy({
  filesLayerOk: true,
  fields: document.querySelectorAll('.cc-rp-sm-field').length
});

La funzione farà tre cose in automatico:

1. Sfrutta il nostro parser interno (anti-circolare) per convertire
   i nodi DOM o gli oggetti complessi in un JSON pulito e leggibile.
2. Copia tutto nella clipboard di sistema mostrandoti un toast di conferma.
3. Ti restituisce il dato originale, così se vuoi puoi anche
   assegnarlo a una variabile per continuare a lavorarci!
================================================================================
*/
