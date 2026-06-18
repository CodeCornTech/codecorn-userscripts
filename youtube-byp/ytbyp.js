// ==UserScript== 208
// @name         YT Music Autoclicker API
// @namespace    https://github.com/tuoprofilo
// @version      2.0.8
// @description  Bypassa popup, notifiche native, debug esteso e zero errori TypeScript
// @author       Tu & Gemini
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=
// @include      *://music.youtube.com/**
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

/* eslint-env browser, greasemonkey */
/* global globalThis */

const VERSION = '2.0.8';

(function (window, globalThis) {
    'use strict';

    /** @typedef {{ message: string, attempts?: number, success?: boolean }} YTBypEventDetail */

    /**
     * @typedef {Object} YTBYP_API L'API esposta globalmente
     * @property {() => void} start
     * @property {() => void} stop
     * @property {() => void} forceCheck
     * @property {() => void} forceClick
     * @property {Function} notify
     * @property {{ yesButton: () => Element | null, modal: () => Element | null }} DOM
     * @property {number | undefined} [interval]
     * @property {MutationObserver | undefined} [bodyObserver]
     * @property {MutationObserver | undefined} [modalObserver]
     */

    /** @type {any} */
    const _global = globalThis;
    
    /** @type {Window & { cccg?: {ccLog?: (m: string) => void}, ytbyp?: YTBYP_API }} */
    const targetWindow = (typeof _global['unsafeWindow'] !== 'undefined' ? _global['unsafeWindow'] : window);

    /** @param {Element | null} el */
    const isVisible = (el) => {
        if (!el) return false;
        if (el.hasAttribute('hidden')) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && (/** @type {HTMLElement} */(el)).offsetWidth > 0;
    };

    /** * @param {string} title 
     * @param {string} body 
     */
    const sendBrowserNotification = (title, body) => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') new Notification(title, { body });
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => p === 'granted' && new Notification(title, { body }));
        }
    };

    /**
     * @param {string} eventName
     * @param {string} message
     * @param {{ attempts?: number, success?: boolean }} [extraPayload={}]
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

    /** @param {string} msg */
    const debug = (msg) => dispatchLog('ytbyp:debug', msg);

    /** @type {YTBYP_API} */
    const API = {
        start: () => {}, // Inizializzato più in basso
        stop: () => {},  // Inizializzato più in basso
        forceCheck: () => {}, // Inizializzato più in basso
        forceClick: () => { 
            const b = /** @type {HTMLElement | null} */ (API.DOM.yesButton()); 
            if(b) b.click(); 
            else debug("forceClick: bottone non trovato."); 
        },
        notify: sendBrowserNotification,
        DOM: {
            yesButton: () => document.querySelector('yt-button-renderer[dialog-confirm] button') || document.querySelector('ytmusic-you-there-renderer button'),
            modal: () => document.querySelector('ytmusic-you-there-renderer')
        },
        interval: undefined,
        bodyObserver: undefined,
        modalObserver: undefined
    };

    const startClickLoop = () => {
        let attempts = 0;
        if (API.interval !== undefined) clearInterval(API.interval);

        debug('Avvio sequenza di controllo click...');

        API.interval = window.setInterval(() => {
            const modal = document.querySelector('ytmusic-you-there-renderer');
            if (!isVisible(modal)) {
                clearInterval(API.interval);
                dispatchLog('ytbyp:modal-closed', 'Modal scomparso o invisibile.', { attempts, success: true });
                return;
            }

            const yesButton = document.querySelector('yt-button-renderer[dialog-confirm] button') || document.querySelector('ytmusic-you-there-renderer button');
            if (yesButton) {
                ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(e => yesButton.dispatchEvent(new MouseEvent(e, { bubbles: true })));
                document.querySelectorAll('video').forEach(v => v.paused && v.play().catch(err => debug(`Errore autoplay video: ${err.message}`)));
                dispatchLog('ytbyp:clicked', 'Click sparato al bottone.', { attempts: ++attempts });
            } else {
                debug(`Tentativo ${attempts + 1}: Modal visibile ma bottone non trovato nel DOM.`);
                attempts++;
            }

            if (attempts >= 50) {
                clearInterval(API.interval);
                dispatchLog('ytbyp:max-attempts', 'Limite 50 tentativi raggiunto.', { attempts, success: false });
            }
        }, 200);
    };

    /** @param {Element} modalElement */
    const attachModalObserver = (modalElement) => {
        const modalHtml = /** @type {HTMLElement} */ (modalElement);
        if (!modalHtml || modalHtml.dataset.ytbypObserved) return;
        modalHtml.dataset.ytbypObserved = 'true';
        
        debug("Agganciato observer attributi dedicato al modal.");
        
        API.modalObserver = new MutationObserver((mutations) => {
            let visibilityChanged = false;
            mutations.forEach(mut => {
                debug(`Mutazione rilevata: attributo '${mut.attributeName}' modificato.`);
                visibilityChanged = true;
            });
            
            if (visibilityChanged && isVisible(modalHtml)) {
                debug("Il modal è diventato visibile tramite cambio attributi! Innesco il bypass.");
                setTimeout(startClickLoop, 150);
            }
        });

        API.modalObserver.observe(modalHtml, { 
            attributes: true, 
            attributeFilter: ['style', 'hidden', 'class', 'dialog', 'aria-hidden'] 
        });
    };

    let isRunning = false;

    API.start = () => {
        if (isRunning) return;
        isRunning = true;
        
        const existingModal = document.querySelector('ytmusic-you-there-renderer');
        if (existingModal) {
            debug("Modal trovato nel DOM all'avvio. Pre-aggancio l'observer.");
            attachModalObserver(existingModal);
            if (isVisible(existingModal)) setTimeout(startClickLoop, 150);
        }

        API.bodyObserver = new MutationObserver((m) => {
            for (const mut of m){
                for (const node of mut.addedNodes){
                    if (node.nodeType === 1) {
                        const el = /** @type {HTMLElement} */(node);
                        const modal = el.tagName === 'YTMUSIC-YOU-THERE-RENDERER' ? el : el.querySelector('ytmusic-you-there-renderer');
                        if (modal) {
                            debug("Nuovo nodo modal inserito nel DOM. Aggancio l'observer dedicato.");
                            attachModalObserver(modal);
                            setTimeout(startClickLoop, 150);
                        }
                    }
                }
            }
        });
        
        API.bodyObserver.observe(document.body, { childList: true, subtree: true });
        dispatchLog('ytbyp:start', `Observer AVVIATO. Version: ${VERSION}`);
    };

    API.stop = () => { 
        isRunning = false; 
        if (API.interval !== undefined) clearInterval(API.interval); 
        if (API.bodyObserver) API.bodyObserver.disconnect();
        if (API.modalObserver) API.modalObserver.disconnect();
        dispatchLog('ytbyp:stop', 'Tutti gli Observer ARRESTATI.');
    };

    API.forceCheck = startClickLoop;

    // Esposizione dell'oggetto pulito e inizializzato
    targetWindow.ytbyp = API;
    API.start();
})(window, globalThis);