# 🌽 CodeCorn Tampermonkey Scripts

Benvenuto nella repository ufficiale degli Userscript di **CodeCorn Technology**. Qui troverai tool avanzati creati da Federico Girolami per potenziare lo sviluppo, il debugging e la gestione della UI direttamente dal browser.

## 🚀 Script in Evidenza: Console Capture (God Mode)

Il fiore all'occhiello della repo. Molto più di un semplice logger di console: è una vera e propria suite da SysAdmin / Front-end Developer integrata nel DOM.

### ✨ Funzionalità Principali

- **Log Capture (Anti-Circolare):** Intercetta `console.log`, `warn`, `error` convertendo in sicurezza oggetti e nodi DOM complessi in JSON puliti. Salva History e Sessione esportabili.
- **Network Spy:** Intercetta e registra automaticamente tutto il traffico in uscita `fetch` e `XMLHttpRequest`.
- **Power Tools Integrati:**
    - ☢️ **Nuke Session:** Pialla istantaneamente Storage e Cookie forzando il ricaricamento pulito.
    - 📊 **HUD Performance:** Visualizza FPS in tempo reale, nodi DOM e memoria Heap JS.
    - 🧲 **Asset Harvester:** Estrae al volo tutti i percorsi di immagini, video e file audio dal DOM.
    - 🎨 **Design Sniffer:** Ispeziona un elemento e copia automaticamente nella clipboard il suo `computed style` CSS (color, font, margin, etc).
    - 🕷️ **SEO / A11y Scanner:** Evidenzia gerarchia Header, link rotti e immagini senza tag `alt`.
    - 🎧 **Event Monitor:** Ascolta click e input su un elemento DOM specifico loggandone i valori live.
- **Live Injector IDE:** Scrivi ed esegui JavaScript o inietta CSS al volo con supporto nativo per l'auto-indentazione e il tasto `Tab`.
- **Thanos Snap & Element Inspector:** Cattura screenshot di singoli nodi DOM scontornati (grazie a `html2canvas`) o distruggili con un click.
- **Impostazioni Globali Sincronizzate:** Grazie alle API `GM_setValue`, le configurazioni (Auto-Show, Gap, Hitbox e posizione della Toolbar) ti seguono su ogni dominio.

### 📥 Installazione

1. Installa l'estensione [Tampermonkey](https://www.tampermonkey.net/) per il tuo browser.
2. Crea un nuovo script e incolla il contenuto del file `CodeCorn_GodMode.user.js` (o installalo direttamente tramite Raw link se configurato).

### ⌨️ Scorciatoie da Tastiera (Shortcuts)

| Azione                        | Scorciatoia        |
| :---------------------------- | :----------------- |
| **Copia Sessione Corrente**   | `Ctrl + Shift + X` |
| **Copia Full History**        | `Ctrl + Shift + H` |
| **Screenshot Intera Pagina**  | `Ctrl + Shift + S` |
| **Inspector Elemento (Foto)** | `Ctrl + Shift + E` |
| **X-Ray Layout**              | `Ctrl + Shift + L` |
| **Live Injector**             | `Ctrl + Shift + J` |
| **Apri Power Tools**          | `Ctrl + Shift + O` |
| **Impostazioni / Help**       | `Ctrl + Shift + I` |
| **Mostra/Nascondi Toolbar**   | `Ctrl + Shift + B` |
| **Sposta Toolbar**            | `Ctrl + Shift + M` |
| **Annulla Modal / Esci Tool** | `Esc`              |

### 🛠️ API Globali

Lo script inietta alcune comodità nel contesto globale della pagina, sfruttabili dal _Live Injector_ o dalla DevTools console:

- `cccg`: Esplora l'intero oggetto God Mode.
- `ccCopy(data)`: Passa un qualsiasi oggetto, stringa o Nodo DOM. La funzione lo serializza in JSON in modo sicuro e lo spara direttamente nella tua clipboard, restituendoti il valore per poterlo usare in variabili.

---

**Autore:** Federico Girolami - [CodeCorn Technology](https://codecorn.it/)  
**Licenza:** MIT
