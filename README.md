# 🌽 CodeCorn Userscripts

A collection of advanced Tampermonkey userscripts crafted for debugging, automation, and UI manipulation

Benvenuto nella repository ufficiale degli Userscript di **[CodeCorn Technology](https://codecorn.it/)**.
Qui raccogliamo, versioniamo e distribuiamo tutti i nostri script personalizzati per Tampermonkey/Greasemonkey, progettati per potenziare il debugging, automatizzare flussi di lavoro e manipolare la UI direttamente dal browser.

## 🚀 Gli Script (Installazione Rapida)

Clicca su **"Installa"** per aggiungere direttamente lo script al tuo browser (richiede l'estensione Tampermonkey attiva).

| Nome Script                         | Versione  | Descrizione                                                                                                                            |                                                               Link                                                                |
| :---------------------------------- | :-------: | :------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------: |
| **God Mode Console Capture**        | `v4.11.0` | La suite definitiva per il front-end debugging. Cattura log, spia il network, Live Injector JS/CSS e Power Tools (Nuke, HUD, Sniffer). | [⚡ Installa](https://raw.githubusercontent.com/codecorntech/codecorn-userscripts/main/god-mode-console/CodeCorn_GodMode.user.js) |
| _CSS Element Highlighter_ (Esempio) | `v1.0.0`  | Evidenzia dinamicamente tutti i div con overflow nascosto per il debug visivo.                                                         |                                                         [⚡ Installa](#)                                                          |
| _Proxmox Auto-Helper_ (Esempio)     | `v1.2.0`  | Aggiunge scorciatoie e bottoni rapidi all'interfaccia web di Proxmox VE.                                                               |                                                         [⚡ Installa](#)                                                          |

> 💡 **Nota per l'installazione:** Assicurati di avere l'estensione [Tampermonkey](https://www.tampermonkey.net/) installata nel tuo browser. Cliccando sui link di installazione, si aprirà automaticamente la pagina di conferma di Tampermonkey.

---

## 📁 Struttura della Repository

Ogni script complesso ha la sua cartella dedicata con un proprio file README che ne documenta le hotkeys, i settings e le API globali.

- 📂 `/god-mode-console` - Il nostro coltellino svizzero per il web debugging. [👉 Leggi la documentazione completa](./god-mode-console/README.md)
- 📂 `/snippets` - Script minori o single-file senza dipendenze complesse.

## 🛠️ Contribuire o Modificare

Se vuoi clonare la repository per sviluppare in locale:

1. Fai il clone della repo: `git clone https://github.com/codecorntech/codecorn-userscripts.git`
2. Modifica i file `.user.js` nel tuo editor preferito.
3. Se usi Tampermonkey, puoi far puntare lo script direttamente al tuo file locale (attivando l'opzione "Consenti l'accesso agli URL dei file" nelle impostazioni dell'estensione del browser) tramite la direttiva `@require file:///percorso/locale/al/tuo/script.user.js`. In questo modo non devi fare copia-incolla a ogni salvataggio!

---

### 🛠️ I Task Spiegati (I tuoi nuovi poteri)

Ecco cosa ti permette di fare adesso il tuo terminale:

#### 🟢 `npm run dev` (Il Game Changer assoluto)

Avvia un server web locale sulla porta `8765` che espone tutta la tua cartella con il CORS abilitato.
**Come si usa in Tampermonkey:** Invece di incollare tutto lo script nel browser, crei un nuovo script su Tampermonkey fatto _solo_ così:

```javascript
// ==UserScript==
// @name         CodeCorn God Mode (DEV)
// @match        *://*/*
// @require      http://localhost:8765/god-mode-console/CodeCorn_GodMode.user.js
// ==/UserScript==
```

Da questo momento, ogni volta che salvi il file in VS Code e ricarichi la pagina sul browser, **Tampermonkey pescherà automaticamente l'ultima versione dal tuo hard disk**. Niente più copia-incolla compulsivi!

#### ✨ `npm run format`

Scansiona tutte le sottocartelle e formatta tutti i file `.js` secondo gli standard di Prettier. (Utile da lanciare prima di un `git commit`).

#### 📦 `npm run build:godmode`

Prende il tuo script del God Mode (che ormai è un bestione) e crea una versione `.min.user.js` compressa e offuscata dentro una cartella `dist/`, mantenendo però i commenti iniziali (`// ==UserScript==`) obbligatori per farla riconoscere a Tampermonkey.

#### 🧹 `npm run clean:prev`

Sfrutta Bash per cercare in tutto il progetto le cartelle di backup `_PREV` e piallarle via in un colpo solo. Ottimo per fare pulizia di primavera.

#### 🏗️ `npm run new:script nome-script`

Un generatore automatico! Digitando `npm run new:script twitch-ad-blocker`, questo task creerà al volo la cartella, inserirà un file `jsconfig.json` standard e creerà il file `.user.js` vuoto, pronto per essere scritto. _(Nota: per farlo funzionare crea una cartella `template/` nella root e mettici dentro il `jsconfig.json` di base)._

---

**Autore:** Federico Girolami  
**Sito Web:** [CodeCorn Technology](https://codecorn.it/)  
**Licenza:** MIT
