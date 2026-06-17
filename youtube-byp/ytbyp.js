// ==UserScript==
// @name         YT Music Autoclicker API
// @namespace    https://github.com/tuoprofilo
// @version      2.0.4
// @description  Bypassa il popup di inattività con API completa, tipizzazione JSDoc e Notifiche
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
     * Invia una notifica nativa del browser (richiede permessi)
     * @param {string} title Titolo della notifica
     * @param {string} body Corpo della notifica
     */
    const sendBrowserNotification = (title, body) => {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            });
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

        // Log tramite ccLog o Console
        if (typeof targetWindow.cccg?.ccLog === 'function') {
            targetWindow.cccg?.ccLog(prefix + message);
        } else {
            console.log(prefix + message);
        }

        /** @type {CustomEvent<YTBypEventDetail>} */
        const event = new CustomEvent(eventName, {
            detail: { message, ...extraPayload },
        });
        document.dispatchEvent(event);

        // --- SISTEMA DI NOTIFICHE ---
        if (eventName === 'ytbyp:max-attempts') {
            sendBrowserNotification('Autoclicker Fallito ❌', 'Raggiunto il limite di tentativi. Il popup è ancora lì.');
        } else if (eventName === 'ytbyp:error') {
            sendBrowserNotification('Autoclicker Crashato ⚠️', `Errore nello script: ${message}`);
        } else if (eventName === 'ytbyp:modal-closed' && extraPayload.attempts && extraPayload.attempts > 0) {
            sendBrowserNotification('Bypass Completato ✅', `Popup chiuso automaticamente in ${extraPayload.attempts} tentativi.`);
        }
    };

    // --- LOGICA CORE ---

    /**
     * Gestisce il loop di tentativi per il click
     */
   const startClickLoop = () => {
        let attempts = 0;
        dispatchLog('ytbyp:modal-detected', 'Modal rilevato. Inizio i tentativi di click...');

        if (clickInterval !== undefined) clearInterval(clickInterval);

        clickInterval = window.setInterval(() => {
            try {
                const modal = document.querySelector('ytmusic-you-there-renderer');
                
                const yesButton = document.querySelector('yt-button-renderer[dialog-confirm] button') || 
                                  document.querySelector('ytmusic-you-there-renderer button.ytSpecButtonShapeNextHost') ||
                                  document.querySelector('ytmusic-you-there-renderer button');

                if (!modal) {
                    clearInterval(clickInterval);
                    dispatchLog('ytbyp:modal-closed', `Modal scomparso. Loop terminato.`, { attempts, success: true });
                    return;
                }

                if (yesButton) {
                    // 1. Clicchiamo il bottone con un evento base (senza "view: window" che fa crashare Tampermonkey)
                    const clickEvent = new Event('click', { bubbles: true, cancelable: true });
                    yesButton.dispatchEvent(clickEvent);
                    /** @type {HTMLElement} */ (yesButton).click(); // Fallback
                    
                    // 2. L'ARMA SEGRETA PER I TAB IN BACKGROUND:
                    // Forziamo direttamente il tag <video> a ripartire, ignorando le restrizioni di focus di YouTube.
                    const videoElements = document.querySelectorAll('video');
                    videoElements.forEach(video => {
                        if (video.paused) {
                            video.play().catch(err => {
                                dispatchLog('ytbyp:video-play-error', `Il browser ha bloccato l'autoplay: ${err.message}`);
                            });
                        }
                    });

                    dispatchLog('ytbyp:clicked', `Click sparato al bottone e player forzato.`, { attempts: attempts + 1, success: true });
                } else {
                    dispatchLog('ytbyp:button-missing', `Modal presente ma bottone NON trovato!`, { attempts: attempts + 1, success: false });
                }

                attempts++;

                if (attempts >= 50) {
                    clearInterval(clickInterval);
                    dispatchLog('ytbyp:max-attempts', 'Limite 50 tentativi raggiunto. Il modal non si chiude.', { attempts, success: false });
                }
            } catch (error) {
                clearInterval(clickInterval);
                dispatchLog('ytbyp:error', error instanceof Error ? error.message : String(error), { success: false });
            }
        }, 200); // NB: Se il tab è in background, Chrome potrebbe rallentare questo 200ms a 1000ms automaticamente (è normale)
    };

    // --- OBSERVER ---

    const observer = new MutationObserver((mutations) => {
        try {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = /** @type {HTMLElement} */ (node);
                        const isModal = el.tagName?.toLowerCase() === 'ytmusic-you-there-renderer';
                        const containsModal = el.querySelector && el.querySelector('ytmusic-you-there-renderer');

                        if (isModal || containsModal) {
                            if (debounceTimer !== undefined) clearTimeout(debounceTimer);
                            if (clickInterval !== undefined) clearInterval(clickInterval);

                            debounceTimer = window.setTimeout(() => startClickLoop(), 150);
                        }
                    }
                }
            }
        } catch (error) {
            dispatchLog('ytbyp:error', error instanceof Error ? error.message : String(error), { success: false });
        }
    });

    // --- API PUBBLICA ---

    /** @type {YTBYP_API} */
    const API = {
        start: () => {
            if (isRunning) return;
            observer.observe(document.body, { childList: true, subtree: true });
            isRunning = true;
            dispatchLog('ytbyp:start', 'Observer AVVIATO e in ascolto.');
        },

        stop: () => {
            if (!isRunning) return;
            observer.disconnect();
            if (debounceTimer !== undefined) clearTimeout(debounceTimer);
            if (clickInterval !== undefined) clearInterval(clickInterval);
            isRunning = false;
            dispatchLog('ytbyp:stop', 'Observer ARRESTATO. Loop interrotti.');
        },

        isActive: () => isRunning,

        forceCheck: () => {
            dispatchLog('ytbyp:force-check', 'Controllo manuale forzato avviato.');
            startClickLoop();
        },
        DOM:{
            observer,
            yesButton: ()=>{
                return document.querySelector('yt-button-renderer[dialog-confirm] button') || 
                       document.querySelector('ytmusic-you-there-renderer button.ytSpecButtonShapeNextHost') ||
                       document.querySelector('ytmusic-you-there-renderer button');
            },
            modal: ()=> {
                return document.querySelector('ytmusic-you-there-renderer') || null;
            },
        }
    };

    // Esposizione globale
    targetWindow.ytbyp = API;

    // Autostart di default
    API.start();
})(window, globalThis);