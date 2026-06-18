// ==UserScript==
// @name         YT Music Autoclicker API
// @namespace    https://github.com/tuoprofilo
// @version      2.0.5
// @description  Bypassa popup, notifiche native e API di debug estesa
// @author       Tu & Gemini
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=
// @include      *://music.youtube.com/**
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

/* eslint-env browser, greasemonkey */
/* global globalThis */
const VERSION='2.0.5';
(function (window, globalThis) {
    'use strict';

    /** @typedef {Object} YTBypEventDetail { message: string, attempts?: number, success?: boolean } */

    /** @type {Window & typeof globalThis & { cccg:{ccCopy?: function(any): any,ccLog?: (m: string) => void}, ytbyp?: YTBYP_API } } */
    const targetWindow = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);

    const isVisible = (el) => {
        if (!el) return false;
        if (el.hasAttribute('hidden')) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && (/** @type {HTMLElement} */(el)).offsetWidth > 0;
    };

    const sendBrowserNotification = (title, body) => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') new Notification(title, { body });
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => p === 'granted' && new Notification(title, { body }));
        }
    };

    const dispatchLog = (eventName, message, extraPayload = {}) => {
        const prefix = '[YT Music Autoclicker] ';
        if (typeof targetWindow.cccg?.ccLog === 'function') targetWindow.cccg.ccLog(prefix + message);
        else console.log(prefix + message);

        document.dispatchEvent(new CustomEvent(eventName, { detail: { message, ...extraPayload } }));

        if (eventName === 'ytbyp:max-attempts') sendBrowserNotification('Autoclicker Fallito ❌', 'Il popup è ancora lì.');
        else if (eventName === 'ytbyp:error') sendBrowserNotification('Autoclicker Crashato ⚠️', message);
        else if (eventName === 'ytbyp:modal-closed' && extraPayload.attempts) sendBrowserNotification('Bypass Completato ✅', `Chiuso in ${extraPayload.attempts} tentativi.`);
    };

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
                ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(e => yesButton.dispatchEvent(new MouseEvent(e, { bubbles: true })));
                document.querySelectorAll('video').forEach(v => v.paused && v.play().catch(() => {}));
                dispatchLog('ytbyp:clicked', 'Click sparato.', { attempts: ++attempts });
            }
            if (attempts >= 50) clearInterval(targetWindow.ytbyp.interval);
        }, 200);
    };

    const API = {
        start: () => {
            isRunning = true;
            new MutationObserver((m) => {
                for (const mut of m){
                    for (const node of mut.addedNodes){
                        if (node.nodeType === 1 && (node.querySelector('ytmusic-you-there-renderer') || (/** @type {HTMLElement} */(node).tagName === 'YTMUSIC-YOU-THERE-RENDERER'))){ setTimeout(startClickLoop, 150); }
                    }
                }
            }).observe(document.body, { childList: true, subtree: true });
            dispatchLog('ytbyp:start', `Observer AVVIATO. Version: ${VERSION}`);
        },
        stop: () => { isRunning = false; clearInterval(targetWindow.ytbyp.interval); },
        forceCheck: startClickLoop,
        notify: sendBrowserNotification, // Esposta per testing manuale
        forceClick: () => { const b = API.DOM.yesButton(); if(b) b.click(); }, // Click crudo per test
        DOM: {
            yesButton: () => document.querySelector('yt-button-renderer[dialog-confirm] button') || document.querySelector('ytmusic-you-there-renderer button'),
            modal: () => document.querySelector('ytmusic-you-there-renderer')
        },
        interval: undefined
    };

    let isRunning = false;
    targetWindow.ytbyp = API;
    API.start();
})(window, globalThis);