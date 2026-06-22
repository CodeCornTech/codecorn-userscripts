// ==UserScript==
// @name         YT Music Autoclicker API (Stealth Trap Edition)
// @namespace    https://github.com/fgirolami29
// @version      2.1.0
// @description  Bypassa popup YT Music con Notifiche Interattive, IntersectionObserver e API di debug. Zero errori TS.
// @author       Tu & Gemini
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=
// @include      *://music.youtube.com/**
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

/* eslint-env browser, greasemonkey */
/* global globalThis */

const VERSION = "2.1.0";
const ICON_BASE64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=";

(function (window, globalThis) {
    "use strict";

    /** @typedef {{ message: string, attempts?: number, success?: boolean }} YTBypEventDetail */

    /**
   * @typedef {Object} YTBYP_API
   * @property {() => void} start
   * @property {() => void} stop
   * @property {() => void} forceCheck
   * @property {() => void} forceClick
   * @property {(delayMs?: number) => void} testTrap
   * @property {Function} notify
   * @property {{ yesButton: () => Element | null, modal: () => Element | null }} DOM
   * @property {number | undefined} [interval]
   * @property {MutationObserver | undefined} [bodyObserver]
   * @property {IntersectionObserver | undefined} [visibilityObserver]
   */

    /** @type {any} */
    const _global = globalThis;

    /** @type {Window & { cccg?: {ccLog?: (m: string) => void}, ytbyp?: YTBYP_API }} */
    const targetWindow =
          typeof _global.unsafeWindow !== "undefined" ? _global.unsafeWindow : window;

    /** @param {Element | null} el */
    const isVisible = (el) => {
        if (!el) return false;
        if (el.hasAttribute("hidden")) return false;
        const style = window.getComputedStyle(el);
        return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0" &&
            /** @type {HTMLElement} */ (el).offsetWidth > 0
        );
    };

    /** * @param {string} title
   * @param {string} body
   * @param {Function} [onClickCallback]
   */
    const sendInteractiveNotification = (title, body, onClickCallback) => {
        if (!("Notification" in window)) return;

        const options = {
            body,
            icon: ICON_BASE64,
            requireInteraction: true, // Non scompare finché non la clicchi
            actions: [
                { action: "yes", title: "✅ SÌ, SONO QUI" }, // Funziona solo con Service Worker, ma lo lasciamo come predisposizione
            ],
        };

        const spawn = () => {
            const n = new Notification(title, options);
            n.onclick = () => {
                window.focus(); // Evoca la finestra di YT Music in primo piano
                n.close();
                if (onClickCallback) onClickCallback();
            };
        };

        if (Notification.permission === "granted") {
            spawn();
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((p) => p === "granted" && spawn());
        }
    };

    /**
   * @param {string} eventName
   * @param {string} message
   * @param {{ attempts?: number, success?: boolean }} [extraPayload={}]
   */
    const dispatchLog = (eventName, message, extraPayload = {}) => {
        const prefix = "[YT Music Autoclicker] ";
        if (typeof targetWindow.cccg?.ccLog === "function")
        { targetWindow.cccg.ccLog(prefix + message);}
        else console.log(prefix + message);

        document.dispatchEvent(
            new CustomEvent(eventName, { detail: { message, ...extraPayload } }),
        );

        if (eventName === "ytbyp:max-attempts")
        { sendInteractiveNotification(
            "Autoclicker Fallito ❌",
            "Il popup è ancora lì.",
            () => API.forceClick(),
        );
        }
        else if (eventName === "ytbyp:error")
        {sendInteractiveNotification("Autoclicker Crashato ⚠️", message);}
        else if (eventName === "ytbyp:modal-closed" && extraPayload.attempts)
        { debug(`Bypass Completato in ${extraPayload.attempts} tentativi.`);}
    };

    /** @param {string} msg */
    const debug = (msg) => dispatchLog("ytbyp:debug", msg);

    /** @type {YTBYP_API} */
    const API = {
        start: () => {},
        stop: () => {},
        forceCheck: () => {},
        forceClick: () => {
            const b = /** @type {HTMLElement | null} */ (API.DOM.yesButton());
            if (b) b.click();
            else debug("forceClick: bottone non trovato.");
        },
        testTrap: (delayMs = 3000) => {
            debug(`Test notifica armato. Arriverà tra ${delayMs}ms...`);
            setTimeout(() => {
                sendInteractiveNotification(
                    "🧪 TEST YT MUSIC",
                    "Se clicchi qui, la scheda verrà focalizzata e simulerò il click.",
                    () => {
                        debug("Test triggerato: focus effettuato e finto click eseguito!");
                        // API.forceClick(); // Togli il commento se vuoi che clicchi davvero nel test
                    },
                );
            }, delayMs);
        },
        notify: sendInteractiveNotification,
        DOM: {
            yesButton: () =>
            document.querySelector("yt-button-renderer[dialog-confirm] button") ||
            document.querySelector("ytmusic-you-there-renderer button"),
            modal: () => document.querySelector("ytmusic-you-there-renderer"),
        },
        interval: undefined,
        bodyObserver: undefined,
        visibilityObserver: undefined,
    };

    const startClickLoop = () => {
        let attempts = 0;
        if (API.interval !== undefined) clearInterval(API.interval);

        debug("Avvio sequenza di click (Utente tornato)...");

        API.interval = window.setInterval(() => {
            const modal = document.querySelector("ytmusic-you-there-renderer");
            if (!isVisible(modal)) {
                clearInterval(API.interval);
                dispatchLog("ytbyp:modal-closed", "Modal scomparso o invisibile.", {
                    attempts,
                    success: true,
                });
                return;
            }

            const yesButton =
                  document.querySelector("yt-button-renderer[dialog-confirm] button") ||
                  document.querySelector("ytmusic-you-there-renderer button");
            if (yesButton) {
                ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(
                    (e) => yesButton.dispatchEvent(new MouseEvent(e, { bubbles: true })),
                );
                document
                    .querySelectorAll("video")
                    .forEach(
                    (v) =>
                    v.paused &&
                    v
                    .play()
                    .catch((err) => debug(`Errore autoplay video: ${err.message}`)),
                );
                dispatchLog("ytbyp:clicked", "Click sparato al bottone.", {
                    attempts: ++attempts,
                });
            } else {
                debug(
                    `Tentativo ${attempts + 1}: Modal visibile ma bottone non trovato nel DOM.`,
                );
                attempts++;
            }

            if (attempts >= 50) {
                clearInterval(API.interval);
                dispatchLog("ytbyp:max-attempts", "Limite 50 tentativi raggiunto.", {
                    attempts,
                    success: false,
                });
            }
        }, 200);
    };

    /** * L'Observer Stealth
   * @param {Element} modalElement
   */
    const attachVisibilityObserver = (modalElement) => {
        const modalHtml = /** @type {HTMLElement} */ (modalElement);
        if (!modalHtml || modalHtml.dataset.ytbypObserved) return;
        modalHtml.dataset.ytbypObserved = "true";

        debug("Agganciato IntersectionObserver al modal.");

        API.visibilityObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        debug(
                            "⚠️ Il modal di pausa è apparso! Innesco la notifica-trappola...",
                        );

                        // LA MAGIA: Invece di cliccare subito, ti chiamo tramite notifica
                        sendInteractiveNotification(
                            "YT Music in Pausa ⏸️",
                            "YouTube chiede se ci sei. Clicca qui per riprendere la musica!",
                            () => {
                                debug(
                                    "Notifica cliccata! Riprendo l'ascolto e chiudo il popup.",
                                );
                                setTimeout(startClickLoop, 150);
                            },
                        );
                    }
                }
            },
            {
                root: null, // Guarda l'intera viewport del browser
                threshold: 0.1, // Basta che appaia il 10% del popup per attivarsi
            },
        );

        API.visibilityObserver.observe(modalHtml);
    };

    let isRunning = false;

    API.start = () => {
        if (isRunning) return;
        isRunning = true;

        // 1. Cerca il modal se è già stato iniettato da YouTube
        const existingModal = document.querySelector("ytmusic-you-there-renderer");
        if (existingModal) {
            debug(
                "Modal trovato nel DOM all'avvio. Pre-aggancio IntersectionObserver.",
            );
            attachVisibilityObserver(existingModal);
        }

        // 2. Observer di sicurezza per la primissima iniezione nel body
        API.bodyObserver = new MutationObserver((m) => {
            for (const mut of m) {
                for (const node of mut.addedNodes) {
                    if (node.nodeType === 1) {
                        const el = /** @type {HTMLElement} */ (node);
                        const modal =
                              el.tagName === "YTMUSIC-YOU-THERE-RENDERER"
                        ? el
                        : el.querySelector("ytmusic-you-there-renderer");
                        if (modal) {
                            debug("Nuovo nodo modal inserito nel DOM.");
                            attachVisibilityObserver(modal);
                        }
                    }
                }
            }
        });

        API.bodyObserver.observe(document.body, { childList: true, subtree: true });
        dispatchLog("ytbyp:start", `Stealth Trap AVVIATO. Version: ${VERSION}`);
    };

    API.stop = () => {
        isRunning = false;
        if (API.interval !== undefined) clearInterval(API.interval);
        if (API.bodyObserver) API.bodyObserver.disconnect();
        if (API.visibilityObserver) API.visibilityObserver.disconnect();
        dispatchLog("ytbyp:stop", "Tutti gli Observer ARRESTATI.");
    };

    API.forceCheck = startClickLoop;

    targetWindow.ytbyp = API;
    API.start();
})(window, globalThis);
