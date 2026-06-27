// ==UserScript==
// @name         YT Music Autoclicker API (Hybrid Core Edition)
// @namespace    https://github.com/fgirolami29
// @version      3.2.1
// @description  Bypass proattivo via API core, sinkhole telemetrico e fallback reattivo a due stadi (Spacebar emulata + Notifica OS Focus). Zero errori TS.
// @author       Tu & Gemini
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=
// @include      *://music.youtube.com/**
// @grant        unsafeWindow
// @run-at       document-idle

/* eslint-env browser, greasemonkey */
/* global globalThis */

const VERSION = '3.2.0';
const ICON_BASE64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=';

/**
 * @typedef {Object} YTBYP_Config
 * @property {number} pingIntervalMs - Intervallo di reset del timer AFK (default: 5 min).
 * @property {boolean} blockTelemetry - Flag per abilitare/disabilitare il sinkhole network.
 * @property {boolean} debugMode - Flag per abilitare/disabilitare l'output verboso.
 * @property {number} fallbackTimeoutMs - Timeout prima di innescare la notifica OS di emergenza (ms).
 */

/** @type {YTBYP_Config} */
const CONFIG = {
    pingIntervalMs: 5 * 60 * 1000,
    blockTelemetry: true,
    debugMode: true,
    fallbackTimeoutMs: 2000,
};

(function (window, globalThis) {
    'use strict';

    /** @type {any} */
    const _global = globalThis;
    const targetWindow = typeof _global.unsafeWindow !== 'undefined' ? _global.unsafeWindow : window;

    /**
     * Dispatcher standardizzato per output di log diagnostici.
     * @param {string} message
     */
    const debug = (message) => {
        if (!CONFIG.debugMode) return;
        const prefix = '[YT Music Bypass] ';
        if (typeof targetWindow.cccg?.ccLog === 'function') {
            targetWindow.cccg.ccLog(prefix + message);
        } else {
            console.log(prefix + message);
        }
    };

    /**
     * API Pubblica esportata nel window per debug e controllo runtime.
     */
    const API = {
        config: CONFIG,
        interval: undefined,
        modalObserver: undefined,
        start: () => {},
        stop: () => {},
        forcePing: () => {},
    };

    /**
     * Inizializza l'isolamento della telemetria tramite Monkey Patching e Network Interception.
     */
    const initTelemetryBlocker = () => {
        if (!CONFIG.blockTelemetry) return;
        debug('Avvio routine di neutralizzazione telemetria (Network Sinkhole)...');

        // 1. Intercettazione Fetch API
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const input = args[0];

            // Type narrowing: estrazione sicura dell'URL gestendo string, URL e Request
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : /** @type {Request} */ (input).url || '';

            const blockList = ['/youtubei/v1/log_event', '/api/stats/qoe', '/api/stats/playback', 'ptracking', 'play_tracking'];

            if (blockList.some((endpoint) => url.includes(endpoint))) {
                debug(`[Sinkhole] Fetch droppata: ${url.split('?')[0]}`);
                return new Response(JSON.stringify({}), { status: 200, statusText: 'OK' });
            }
            return originalFetch.apply(this, args);
        };

        // 2. Intercettazione XHR (Trasporto Legacy)
        const originalXhrOpen = XMLHttpRequest.prototype.open;

        /**
         * @this {XMLHttpRequest}
         * @param {string} method
         * @param {string | URL} url
         * @param {...any} rest
         */
        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            const blockList = ['/log_event', '/stats/', 'ptracking'];

            // Type narrowing: normalizzazione dell'input URL per le comparazioni
            const urlString = typeof url === 'string' ? url : url.href;

            if (blockList.some((endpoint) => urlString.includes(endpoint))) {
                debug(`[Sinkhole] XHR droppata: ${urlString.split('?')[0]}`);

                this.send = function () {
                    Object.defineProperty(this, 'readyState', { value: 4 });
                    Object.defineProperty(this, 'status', { value: 200 });
                    Object.defineProperty(this, 'responseText', { value: '{}' });

                    // Trigger degli eventi fornendo le istanze Event richieste dalle definizioni TS
                    if (typeof this.onreadystatechange === 'function') {
                        this.onreadystatechange(new Event('readystatechange'));
                    }
                    if (typeof this.onload === 'function') {
                        this.onload(new ProgressEvent('load'));
                    }
                };
                return;
            }
            return originalXhrOpen.call(this, method, url, ...rest);
        };

        // 3. Stubbing Metodi Nativi Core Player
        const overrideCoreLogging = () => {
            const playerEl = document.querySelector('ytmusic-player');
            const corePlayer = playerEl ? /** @type {any} */ (playerEl).getPlayer?.() : null;
            if (!corePlayer) return;

            const logMethods = [
                'logImaAdEvent',
                'logApiCall',
                'logClick',
                'logVisibility',
                'sendImpression',
                'impressionLog',
                'setTrackingParams',
            ];
            let patched = 0;
            logMethods.forEach((method) => {
                if (typeof corePlayer[method] === 'function') {
                    corePlayer[method] = () => {};
                    patched++;
                }
            });
            if (patched > 0) debug(`Patch applicata su ${patched} metodi di logging nativi.`);
        };

        setTimeout(overrideCoreLogging, 5000);
    };

    /**
     * Esegue il ping alle API interne per resettare i contatori di attività locale e server-side.
     */
    const executeEngagementPing = () => {
        const playerEl = document.querySelector('ytmusic-player');
        const corePlayer = playerEl ? /** @type {any} */ (playerEl).getPlayer?.() : null;

        if (corePlayer) {
            let successCount = 0;
            if (typeof corePlayer.updateLastActiveTime === 'function') {
                corePlayer.updateLastActiveTime();
                successCount++;
            }
            if (typeof corePlayer.setUserEngagement === 'function') {
                corePlayer.setUserEngagement();
                successCount++;
            }
            if (successCount > 0) debug('✅ Ping inviato. Timer inattività (AFK) azzerato.');
        }
    };

    /**
     * Valuta l'effettiva visibilità di un nodo nel DOM.
     * @param {Element | null} el
     */
    const isVisible = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            /** @type {HTMLElement} */ (el).offsetWidth > 0
        );
    };

    /**
     * Esegue il dispatcher di fallback reattivo monitorando il DOM per instanziazioni anomale del modal.
     */
    const initReactiveFallback = () => {
        debug('Avvio strato di fallback reattivo (Observer su Body)...');

        API.modalObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        const el = /** @type {HTMLElement} */ (node);
                        const modal = el.tagName === 'YTMUSIC-YOU-THERE-RENDERER' ? el : el.querySelector('ytmusic-you-there-renderer');

                        if (modal) {
                            debug('🚨 Fallback Innescato: Rilevato modal AFK nonostante il ping proattivo.');

                            // Livello Fallback 1: Simulazione nativa Spacebar
                            const spaceEvent = new KeyboardEvent('keydown', {
                                key: ' ',
                                code: 'Space',
                                keyCode: 32,
                                bubbles: true,
                                cancelable: true,
                            });
                            document.body.dispatchEvent(spaceEvent);
                            debug('Tasto Spazio emulato e dislocato sul body.');

                            // Livello Fallback 2: Notifica OS interattiva (Extrema Ratio)
                            setTimeout(() => {
                                if (isVisible(modal) && 'Notification' in window) {
                                    debug('⚠️ Spacebar fallita o ignorata. Lancio notifica OS di emergenza.');

                                    const spawnNotification = () => {
                                        const n = new Notification('YT Music Bloccato ⏸️', {
                                            body: 'Il blocco AFK ha eluso i controlli. Clicca per forzare il focus e riprendere.',
                                            icon: ICON_BASE64,
                                            requireInteraction: true,
                                        });

                                        n.onclick = () => {
                                            window.focus();
                                            n.close();

                                            // Esecuzione forza bruta sul nodo bottone come clean-up finale
                                            const yesBtn =
                                                document.querySelector('yt-button-renderer[dialog-confirm] button') ||
                                                modal.querySelector('button');
                                            if (yesBtn) {
                                                /** @type {HTMLElement} */ (yesBtn).click();
                                                debug('Focus completato. Click fisico sul DOM eseguito.');
                                            }
                                        };
                                    };

                                    if (Notification.permission === 'granted') {
                                        spawnNotification();
                                    } else if (Notification.permission !== 'denied') {
                                        Notification.requestPermission().then((p) => p === 'granted' && spawnNotification());
                                    }
                                } else {
                                    debug('✅ Modal risolto dalla spacebar. Nessun intervento OS richiesto.');
                                }
                            }, CONFIG.fallbackTimeoutMs);
                        }
                    }
                }
            }
        });

        API.modalObserver.observe(document.body, { childList: true, subtree: true });
    };

    let isRunning = false;

    API.start = () => {
        if (isRunning) return;
        isRunning = true;

        debug(`Inizializzazione v${VERSION} [Hybrid Core Architecture].`);

        // Setup Componenti
        initTelemetryBlocker();
        initReactiveFallback();

        // Innesco Routine
        setTimeout(executeEngagementPing, 10000);
        API.interval = window.setInterval(executeEngagementPing, CONFIG.pingIntervalMs);
    };

    API.stop = () => {
        isRunning = false;
        if (API.interval !== undefined) clearInterval(API.interval);
        if (API.modalObserver) API.modalObserver.disconnect();
        debug('Demone arrestato. Protezione disattivata.');
    };

    API.forcePing = executeEngagementPing;

    // Binding Global
    targetWindow.ytbyp = API;

    // Auto-avvio sicuro
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        API.start();
    } else {
        document.addEventListener('DOMContentLoaded', API.start);
    }
})(window, globalThis);
