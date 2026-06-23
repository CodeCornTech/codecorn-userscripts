// ==UserScript==
// @name         YT Music Autoclicker API (Proactive & Stealth Edition)
// @namespace    https://github.com/fgirolami29
// @version      3.1.0
// @description  Previene il popup di YT Music tramite reset API core e disabilita la telemetria/logging di YouTube.
// @author       Tu & Gemini
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=
// @include      *://music.youtube.com/**
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

/* eslint-env browser, greasemonkey */
/* global globalThis */

const VERSION = '3.1.0';

/**
 * @typedef {Object} YTBYP_Config
 * @property {number} pingIntervalMs - Intervallo di reset del timer AFK (default: 5 min).
 * @property {boolean} blockTelemetry - Flag per abilitare/disabilitare il sinkhole network.
 * @property {boolean} debugMode - Flag per abilitare/disabilitare l'output verboso.
 */

/** @type {YTBYP_Config} */
const CONFIG = {
    pingIntervalMs: 5 * 60 * 1000,
    blockTelemetry: true,
    debugMode: true
};

(function (window, globalThis) {
    'use strict';

    /** @type {any} */
    const _global = globalThis;
    const targetWindow = typeof _global.unsafeWindow !== 'undefined' ? _global.unsafeWindow : window;

    const debug = (message) => {
        if (!CONFIG.debugMode) return;
        const prefix = '[YT Music Bypass] ';
        if (typeof targetWindow.cccg?.ccLog === 'function') {
            targetWindow.cccg.ccLog(prefix + message);
        } else {
            console.log(prefix + message);
        }
    };

    const API = {
        config: CONFIG,
        interval: undefined,
        start: () => {},
        stop: () => {},
        forcePing: () => {}
    };

    /**
     * Inizializza l'isolamento della telemetria tramite Monkey Patching e Network Interception.
     */
    const initTelemetryBlocker = () => {
        if (!CONFIG.blockTelemetry) return;
        debug('Avvio routine di neutralizzazione telemetria (Network Sinkhole)...');

        // 1. Intercettazione Fetch API
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
            const blockList = ['/youtubei/v1/log_event', '/api/stats/qoe', '/api/stats/playback', 'ptracking', 'play_tracking'];

            if (blockList.some(endpoint => url.includes(endpoint))) {
                debug(`[Sinkhole] Fetch droppata: ${url.split('?')[0]}`);
                return new Response(JSON.stringify({}), { status: 200, statusText: 'OK' });
            }
            return originalFetch.apply(this, args);
        };

        // 2. Intercettazione XHR
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            const blockList = ['/log_event', '/stats/', 'ptracking'];
            
            if (typeof url === 'string' && blockList.some(endpoint => url.includes(endpoint))) {
                debug(`[Sinkhole] XHR droppata: ${url.split('?')[0]}`);
                this.send = function() {
                    Object.defineProperty(this, 'readyState', { value: 4 });
                    Object.defineProperty(this, 'status', { value: 200 });
                    Object.defineProperty(this, 'responseText', { value: '{}' });
                    if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
                    if (typeof this.onload === 'function') this.onload();
                };
                return;
            }
            return originalXhrOpen.call(this, method, url, ...rest);
        };

        // 3. Stubbing Metodi Nativi Core Player
        const overrideCoreLogging = () => {
            const playerEl = document.querySelector('ytmusic-player');
            const corePlayer = playerEl ? /** @type {any} */(playerEl).getPlayer?.() : null;
            if (!corePlayer) return;

            const logMethods = ['logImaAdEvent', 'logApiCall', 'logClick', 'logVisibility', 'sendImpression', 'impressionLog', 'setTrackingParams'];
            let patched = 0;
            logMethods.forEach(method => {
                if (typeof corePlayer[method] === 'function') {
                    corePlayer[method] = () => {};
                    patched++;
                }
            });
            if (patched > 0) debug(`Patch applicata su ${patched} metodi di logging nativi.`);
        };

        setTimeout(overrideCoreLogging, 5000);
    };

    const executeEngagementPing = () => {
        const playerEl = document.querySelector('ytmusic-player');
        const corePlayer = playerEl ? /** @type {any} */(playerEl).getPlayer?.() : null;

        if (corePlayer) {
            let successCount = 0;
            if (typeof corePlayer.updateLastActiveTime === 'function') { corePlayer.updateLastActiveTime(); successCount++; }
            if (typeof corePlayer.setUserEngagement === 'function') { corePlayer.setUserEngagement(); successCount++; }
            if (successCount > 0) debug('✅ Ping inviato. Timer inattività (AFK) azzerato.');
        }
    };

    let isRunning = false;

    API.start = () => {
        if (isRunning) return;
        isRunning = true;
        
        debug(`Inizializzazione v${VERSION}.`);
        initTelemetryBlocker();

        setTimeout(executeEngagementPing, 10000);
        API.interval = window.setInterval(executeEngagementPing, CONFIG.pingIntervalMs);
    };

    API.stop = () => {
        isRunning = false;
        if (API.interval !== undefined) clearInterval(API.interval);
        debug('Demone arrestato. Protezione AFK disattivata.');
    };

    API.forcePing = executeEngagementPing;

    targetWindow.ytbyp = API;
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        API.start();
    } else {
        document.addEventListener('DOMContentLoaded', API.start);
    }

})(window, globalThis);