// ==UserScript==
// @name         YT Music Autoclicker API (Stealth Trap Edition)
// @namespace    https://github.com/fgirolami29
// @version      2.3.0
// @description  Bypassa popup YT Music con rilevamento transizioni animating-bezel via MutationObserver, Spacebar emulato e fallback interattivo. Zero errori TS.
// @author       Tu & Gemini
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=
// @include      *://music.youtube.com/**
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

/* eslint-env browser, greasemonkey */
/* global globalThis */

const VERSION = '2.3.0';
const ICON_BASE64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=';

/**
 * @typedef {Object} YTBYP_Config
 * @property {number} checkIntervalMs - Frequenza del loop di ricerca bottone (ms).
 * @property {number} maxAttempts - Numero massimo di iterazioni del loop prima del timeout.
 * @property {number} restartDelayMs - Ritardo avvio loop dopo il click sulla notifica (ms).
 * @property {number} observerThreshold - Ratio di visibilità per triggerare l'observer (0.0 - 1.0).
 * @property {number} fallbackTimeoutMs - Tempo limite per l'attuazione dell'evento prima del fallback interattivo (ms).
 * @property {boolean} debugMode - Flag per abilitare/disabilitare l'output di debug.
 */

/** @type {YTBYP_Config} */
const CONFIG = {
    checkIntervalMs: 200,
    maxAttempts: 50,
    restartDelayMs: 150,
    observerThreshold: 0.1,
    fallbackTimeoutMs: 1500,
    debugMode: true,
};

(function (window, globalThis) {
    'use strict';

    /** @typedef {{ message: string, attempts?: number, success?: boolean }} YTBypEventDetail */

    /**
     * @typedef {Object} YTBYP_API
     * @property {YTBYP_Config} config
     * @property {() => void} start
     * @property {() => void} stop
     * @property {() => void} forceCheck
     * @property {() => void} forceClick
     * @property {(delayMs?: number) => void} testTrap
     * @property {Function} notify
     * @property {{ yesButton: () => Element | null, modal: () => Element | null, player: () => Element | null }} DOM
     * @property {number | undefined} [interval]
     * @property {MutationObserver | undefined} [bodyObserver]
     * @property {IntersectionObserver | undefined} [visibilityObserver]
     * @property {MutationObserver | undefined} [playerObserver]
     */

    /** @type {any} */
    const _global = globalThis;

    /** @type {Window & { cccg?: {ccLog?: (m: string) => void}, ytbyp?: YTBYP_API }} */
    const targetWindow = typeof _global.unsafeWindow !== 'undefined' ? _global.unsafeWindow : window;

    /** * Valuta l'effettiva visibilità di un nodo nel DOM.
     * @param {Element | null} el
     */
    const isVisible = (el) => {
        if (!el) return false;
        if (el.hasAttribute('hidden')) return false;
        const style = window.getComputedStyle(el);
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            /** @type {HTMLElement} */ (el).offsetWidth > 0
        );
    };

    /** * Genera la notifica di sistema interattiva.
     * @param {string} title
     * @param {string} body
     * @param {Function} [onClickCallback]
     */
    const sendInteractiveNotification = (title, body, onClickCallback) => {
        if (!('Notification' in window)) return;

        const options = {
            body,
            icon: ICON_BASE64,
            requireInteraction: true, // Persistenza attiva finché non interagita
        };

        const spawn = () => {
            const n = new Notification(title, options);
            n.onclick = () => {
                window.focus(); // Richiama il focus sulla finestra di YT Music
                n.close();
                if (onClickCallback) onClickCallback();
            };
        };

        if (Notification.permission === 'granted') {
            spawn();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((p) => p === 'granted' && spawn());
        }
    };

    /**
     * Dispatcher centralizzato per log console ed eventi custom DOM.
     * @param {string} eventName
     * @param {string} message
     * @param {{ attempts?: number, success?: boolean }} [extraPayload={}]
     */
    const dispatchLog = (eventName, message, extraPayload = {}) => {
        const prefix = '[YT Music Autoclicker] ';
        if (typeof targetWindow.cccg?.ccLog === 'function') {
            targetWindow.cccg.ccLog(prefix + message);
        } else {
            // Esegue il console.log standard solo se non è un messaggio di debug o se la config debugMode è attiva
            if (eventName !== 'ytbyp:debug' || CONFIG.debugMode) {
                console.log(prefix + message);
            }
        }

        document.dispatchEvent(new CustomEvent(eventName, { detail: { message, ...extraPayload } }));

        if (eventName === 'ytbyp:max-attempts') {
            sendInteractiveNotification('Autoclicker Fallito ❌', 'Il popup è ancora lì.', () => API.forceClick());
        } else if (eventName === 'ytbyp:error') {
            sendInteractiveNotification('Autoclicker Crashato ⚠️', message);
        } else if (eventName === 'ytbyp:modal-closed' && extraPayload.attempts) {
            debug(`Bypass Completato in ${extraPayload.attempts} tentativi.`);
        }
    };

    /** * Wrapper per i messaggi di routine, filtrati dalla configurazione.
     * @param {string} msg
     */
    const debug = (msg) => {
        if (CONFIG.debugMode) dispatchLog('ytbyp:debug', msg);
    };

    /** @type {YTBYP_API} */
    const API = {
        config: CONFIG,
        start: () => {},
        stop: () => {},
        forceCheck: () => {},
        forceClick: () => {
            const b = /** @type {HTMLElement | null} */ (API.DOM.yesButton());
            if (b) b.click();
            else debug('forceClick: bottone non trovato.');
        },
        testTrap: (delayMs = 3000) => {
            debug(`Test notifica armato. Arriverà tra ${delayMs}ms...`);
            setTimeout(() => {
                sendInteractiveNotification('🧪 TEST YT MUSIC', 'Se clicchi qui, la scheda verrà focalizzata e simulerò il click.', () => {
                    debug('Test triggerato: focus effettuato e finto click eseguito!');
                    // API.forceClick(); // Togli il commento se vuoi che clicchi davvero nel test
                });
            }, delayMs);
        },
        notify: sendInteractiveNotification,
        DOM: {
            yesButton: () =>
                document.querySelector('yt-button-renderer[dialog-confirm] button') ||
                document.querySelector('ytmusic-you-there-renderer button'),
            modal: () => document.querySelector('ytmusic-you-there-renderer'),
            player: () => document.querySelector('ytmusic-player'),
        },
        interval: undefined,
        bodyObserver: undefined,
        visibilityObserver: undefined,
        playerObserver: undefined,
    };

    const startClickLoop = () => {
        let attempts = 0;
        if (API.interval !== undefined) clearInterval(API.interval);

        debug('Avvio sequenza di click (Utente tornato)...');

        API.interval = window.setInterval(() => {
            const modal = document.querySelector('ytmusic-you-there-renderer');
            if (!isVisible(modal)) {
                clearInterval(API.interval);
                dispatchLog('ytbyp:modal-closed', 'Modal scomparso o invisibile.', {
                    attempts,
                    success: true,
                });
                return;
            }

            const yesButton =
                document.querySelector('yt-button-renderer[dialog-confirm] button') ||
                document.querySelector('ytmusic-you-there-renderer button');
            if (yesButton) {
                ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((e) =>
                    yesButton.dispatchEvent(new MouseEvent(e, { bubbles: true })),
                );
                document
                    .querySelectorAll('video')
                    .forEach((v) => v.paused && v.play().catch((err) => debug(`Errore autoplay video: ${err.message}`)));
                dispatchLog('ytbyp:clicked', 'Click sparato al bottone.', {
                    attempts: ++attempts,
                });
            } else {
                debug(`Tentativo ${attempts + 1}: Modal visibile ma bottone non trovato nel DOM.`);
                attempts++;
            }

            if (attempts >= CONFIG.maxAttempts) {
                clearInterval(API.interval);
                dispatchLog('ytbyp:max-attempts', `Limite ${CONFIG.maxAttempts} tentativi raggiunto.`, {
                    attempts,
                    success: false,
                });
            }
        }, CONFIG.checkIntervalMs);
    };

    /** * L'Observer Stealth per l'intercettazione del popup.
     * @param {Element} modalElement
     */
    const attachVisibilityObserver = (modalElement) => {
        const modalHtml = /** @type {HTMLElement} */ (modalElement);
        if (!modalHtml || modalHtml.dataset.ytbypObserved) return;
        modalHtml.dataset.ytbypObserved = 'true';

        debug('Agganciato IntersectionObserver al modal.');

        API.visibilityObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        debug('⚠️ Il modal di pausa è apparso! Iniezione evento Spacebar ed esame del player...');

                        const playerEl = API.DOM.player();
                        let isBypassed = false;
                        let fallbackTimeout = null;

                        // Funzione di clean-up dei listener temporanei per l'evento corrente
                        const clearBypassContext = () => {
                            if (API.playerObserver) {
                                API.playerObserver.disconnect();
                                API.playerObserver = undefined;
                            }
                            if (fallbackTimeout) {
                                clearTimeout(fallbackTimeout);
                                fallbackTimeout = null;
                            }
                        };

                        if (playerEl) {
                            // Monitoraggio mutazioni attributi su ytmusic-player
                            API.playerObserver = new MutationObserver((mutations) => {
                                for (const mutation of mutations) {
                                    if (mutation.attributeName === 'animating-bezel' || playerEl.hasAttribute('animating-bezel')) {
                                        isBypassed = true;
                                        clearBypassContext();
                                        debug('🎉 Transizione "animating-bezel" intercettata. Riproduzione riavviata.');

                                        sendInteractiveNotification(
                                            'Bypass COMPLETATO! ✅',
                                            'La riproduzione è stata ripristinata automaticamente.',
                                        );

                                        // Avvio loop di allineamento DOM per forzare la chiusura del modal residuo
                                        setTimeout(startClickLoop, CONFIG.restartDelayMs);
                                        break;
                                    }
                                }
                            });

                            API.playerObserver.observe(playerEl, {
                                attributes: true,
                                attributeFilter: ['animating-bezel'],
                            });
                        }

                        // Generazione e dispatch dell'evento sintetico KeyboardEvent sul body
                        const spaceEvent = new KeyboardEvent('keydown', {
                            key: ' ',
                            code: 'Space',
                            keyCode: 32,
                            bubbles: true,
                            cancelable: true,
                        });
                        document.body.dispatchEvent(spaceEvent);

                        // Fallback di sicurezza (Estrema Unzione): attivato solo se l'evento Spacebar fallisce l'aggancio entro il timeout definito
                        fallbackTimeout = setTimeout(() => {
                            clearBypassContext();
                            if (!isBypassed) {
                                debug('❌ Rilevamento transizione fallito o timeout esaurito. Innesco notifica interattiva standard.');
                                sendInteractiveNotification(
                                    'YT Music in Pausa ⏸️',
                                    'YouTube chiede se ci sei. Clicca qui per riprendere la musica!',
                                    () => {
                                        debug('Notifica cliccata! Esecuzione routine di sblocco.');
                                        setTimeout(startClickLoop, CONFIG.restartDelayMs);
                                    },
                                );
                            }
                        }, CONFIG.fallbackTimeoutMs);
                    }
                }
            },
            {
                root: null, // Rilevamento sull'intera viewport
                threshold: CONFIG.observerThreshold, // Ratio di attivazione configurabile
            },
        );

        API.visibilityObserver.observe(modalHtml);
    };

    let isRunning = false;

    API.start = () => {
        if (isRunning) return;
        isRunning = true;

        // 1. Hook iniziale su modal preesistenti
        const existingModal = document.querySelector('ytmusic-you-there-renderer');
        if (existingModal) {
            debug("Modal trovato nel DOM all'avvio. Pre-aggancio IntersectionObserver.");
            attachVisibilityObserver(existingModal);
        }

        // 2. Observer di sicurezza per la mutazione del body
        API.bodyObserver = new MutationObserver((m) => {
            for (const mut of m) {
                for (const node of mut.addedNodes) {
                    if (node.nodeType === 1) {
                        const el = /** @type {HTMLElement} */ (node);
                        const modal = el.tagName === 'YTMUSIC-YOU-THERE-RENDERER' ? el : el.querySelector('ytmusic-you-there-renderer');
                        if (modal) {
                            debug('Nuovo nodo modal inserito nel DOM.');
                            attachVisibilityObserver(modal);
                        }
                    }
                }
            }
        });

        API.bodyObserver.observe(document.body, { childList: true, subtree: true });
        dispatchLog('ytbyp:start', `Stealth Trap AVVIATO. Version: ${VERSION}`);
    };

    API.stop = () => {
        isRunning = false;
        if (API.interval !== undefined) clearInterval(API.interval);
        if (API.bodyObserver) API.bodyObserver.disconnect();
        if (API.visibilityObserver) API.visibilityObserver.disconnect();
        if (API.playerObserver) API.playerObserver.disconnect();
        dispatchLog('ytbyp:stop', 'Tutti gli Observer ARRESTATI.');
    };

    API.forceCheck = startClickLoop;

    targetWindow.ytbyp = API;
    API.start();
})(window, globalThis);
