// ==UserScript==
// @name         YT Music Autoclicker API
// @namespace    https://github.com/tuoprofilo
// @version      2.0.51
// @description  Bypassa popup, notifiche native e API di debug estesa
// @author       Tu & Gemini
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=
// @include      *://music.youtube.com/**
// @exclude      /^https?://\w+\.youtube\.com\/live_chat.*$/
// @exclude      /^https?://\S+\.(txt|png|jpg|jpeg|gif|xml|svg|manifest|log|ini)[^\/]*$/
// @grant        unsafeWindow
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM.openInTab
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_addElement
// ==/UserScript==

/**
 * @fileoverview Modulo Autoclicker per YouTube Music.
 * Espone un'API tipizzata, genera CustomEvent sul DOM e notifiche browser.
 */
// @ts-ignore
const _unsafeWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : null;

/* eslint-env browser, greasemonkey */
/* global globalThis */
const VERSION = '2.0.51';
(function (window, globalThis) {
    'use strict';

    /**
     * @typedef {Object} YTBypEventDetail Dettagli passati agli eventi custom
     * @property {string} message Messaggio di log descrittivo
     * @property {number} [attempts] Numero di tentativi eseguiti
     * @property {boolean} [success] Esito dell'operazione
     */

    /**
     * @typedef {Object} DOM espone elementi del DOM che servono allo script per debugging
     * @property {MutationObserver | null} observer Riferimento all'istanza del MutationObserver
     * @property {() => Element | null} modal ritorna l'elemento del modal
     * @property {() => Element | null} yesButton ritorna l'elemento dello YES BUTTON nel modal
     */

    /**
     * @typedef {Object} YTBYP_API L'API esposta globalmente
     * @property {() => void} start Avvia l'observer per intercettare i modal
     * @property {() => void} stop Ferma l'observer e cancella i timer attivi
     * @property {() => boolean} isActive Restituisce lo stato attuale (in esecuzione o no)
     * @property {() => void} forceCheck Forza un controllo immediato del DOM
     * @property {DOM} DOM espone elementi del DOM che servono allo script per debugging
     */

    /**
     * @typedef {Window & typeof globalThis & { cccg:{ccCopy?: function(any): any,ccLog?: (m: string) => void}, html2canvas?: any, ytbyp?: YTBYP_API } } TargetWindow
     */

    /** @type {TargetWindow} */
    const targetWindow = _unsafeWindow ? /** @type {TargetWindow} */ (_unsafeWindow) : /** @type {TargetWindow} */ (window);

    // 1. Controllo ambiente (Dominio & App)
    if (!/^music\.youtube\.[a-z]+$/.test(window.location.hostname)) return;
    if (!document.querySelector('ytmusic-app')) return;

    // --- VARIABILI DI STATO ---
    /** @type {number | undefined} */
    let debounceTimer = undefined;
    /** @type {number | undefined} */
    let clickInterval = undefined;
    /** @type {boolean} */
    let isRunning = false;

    // --- UTILITIES ---

    /**
     * Verifica se un elemento esiste nel DOM ed è effettivamente visibile a schermo
     * @param {Element | null} el L'elemento da controllare
     * @returns {boolean}
     */
    const isVisible = (el) => {
        if (!el) return false;
        if (el.hasAttribute('hidden')) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && /** @type {HTMLElement} */ (el).offsetWidth > 0;
    };
 /**
     * Invia una notifica nativa del browser (richiede permessi)
     * @param {string} title Titolo della notifica
     * @param {string} body Corpo della notifica
     */
    const sendBrowserNotification = (title, body) => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') new Notification(title, { body });
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((p) => p === 'granted' && new Notification(title, { body }));
        }
    };

    /**
     * Gestisce i log, dispatcia eventi custom sul document e lancia notifiche se necessario
     * @param {string} eventName Nome dell'evento (es. 'ytbyp:start')
     * @param {string} message Messaggio da loggare
     * @param {{ attempts?: number, success?: boolean }} [extraPayload={}] Dati aggiuntivi per l'evento
     */
    const dispatchLog = (eventName, message, extraPayload = {}) => {
        const prefix = '[YT Music Autoclicker] ';
        if (typeof targetWindow.cccg?.ccLog === 'function') targetWindow.cccg.ccLog(prefix + message);
        else console.log(prefix + message);

        document.dispatchEvent(new CustomEvent(eventName, { detail: { message, ...extraPayload } }));

        if (eventName === 'ytbyp:max-attempts') sendBrowserNotification('Autoclicker Fallito ❌', 'Il popup è ancora lì.');
        else if (eventName === 'ytbyp:error') sendBrowserNotification('Autoclicker Crashato ⚠️', message);
        else if (eventName === 'ytbyp:modal-closed' && extraPayload.attempts) sendBrowserNotification('Bypass Completato ✅', `Chiuso in ${extraPayload.attempts} tentativi.`);
    };
    // --- LOGICA CORE ---
    /**
     * Gestisce il loop di tentativi per il click
     */
    const startClickLoop = () => {
        let attempts = 0;
        if (targetWindow.ytbyp?.interval) clearInterval(targetWindow.ytbyp.interval);

        targetWindow.ytbyp.interval = window.setInterval(() => {
            const modal = document.querySelector('ytmusic-you-there-renderer');
            if (!isVisible(modal)) {
                clearInterval(targetWindow.ytbyp.interval);
                dispatchLog('ytbyp:modal-closed', 'Modal scomparso.', { attempts, success: true });
                return;
            }

            const yesButton = document.querySelector('yt-button-renderer[dialog-confirm] button') || document.querySelector('ytmusic-you-there-renderer button');
            if (yesButton) {
                ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((e) => yesButton.dispatchEvent(new MouseEvent(e, { bubbles: true })));
                document.querySelectorAll('video').forEach((v) => v.paused && v.play().catch(() => {}));
                dispatchLog('ytbyp:clicked', 'Click sparato.', { attempts: ++attempts });
            }
            if (attempts >= 50) clearInterval(targetWindow.ytbyp.interval);
        }, 200);
    };
    // --- API PUBBLICA ---

    /** @type {YTBYP_API} */
    const API = {
        start: () => {
            isRunning = true;
            new MutationObserver((m) => {
                for (const mut of m) {
                    for (const node of mut.addedNodes) {
                        const el = /** @type {HTMLElement} */ (node);
                        if (el.nodeType === 1 && (el.querySelector('ytmusic-you-there-renderer') || el.tagName === 'YTMUSIC-YOU-THERE-RENDERER')) {
                            setTimeout(startClickLoop, 150);
                        }
                    }
                }
            }).observe(document.body, { childList: true, subtree: true });
            dispatchLog('ytbyp:start', `Observer AVVIATO. Version: ${VERSION}`);
        },
        stop: () => {
            isRunning = false;
            clearInterval(targetWindow.ytbyp.interval);
        },
        forceCheck: startClickLoop,
        notify: sendBrowserNotification, // Esposta per testing manuale
        forceClick: () => {
            const b = API.DOM.yesButton();
            if (b) b.click();
        }, // Click crudo per test
        DOM: {
            yesButton: () => document.querySelector('yt-button-renderer[dialog-confirm] button') || document.querySelector('ytmusic-you-there-renderer button'),
            modal: () => document.querySelector('ytmusic-you-there-renderer'),
        },
        interval: undefined,
    };

    targetWindow.ytbyp = API;
    API.start();
})(window, globalThis);
