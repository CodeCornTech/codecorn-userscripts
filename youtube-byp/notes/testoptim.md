```js
const player = document.querySelector('ytmusic-player');
const app = document.querySelector('ytmusic-app');

const ytDump = {
    playerAPI: player ? Object.keys(player).filter((k) => typeof player[k] === 'function' || k.toLowerCase().includes('yt')) : null,
    appAPI: app ? Object.keys(app).filter((k) => typeof app[k] === 'function' || k.toLowerCase().includes('yt')) : null,
    windowYt: Object.keys(window).filter((k) => k.startsWith('yt') || k.startsWith('_yt')),
};

console.log(JSON.stringify(ytDump, null, 2));
```

Hook Redux installato e in ascolto. Eseguire il test in ambiente "vanilla" (senza l'estensione 3.1.0 attiva) è il metodo corretto per isolare il payload originale inviato dal server prima che il nostro demone proattivo lo inibisca a monte.

### Procedura di cattura

Il middleware Redux sta ora analizzando il traffico di stato. Il tempo di latenza per il trigger nativo (AFK timeout) varia solitamente tra i 30 e i 90 minuti di inattività lato utente.

Quando il server o il timer locale inviano il segnale di blocco, la console restituirà l'alert:
`🚨 INTERCETTATO COMANDO MODAL 'SEI ANCORA LÌ?'`

Subito sotto, il browser formatterà l'oggetto JSON `action`.

### Ottimizzazione dei tempi di test

Per ridurre i tempi di attesa e forzare lo scorrimento della playlist (che spesso concorre al calcolo dell'AFK insieme al wall-clock time), puoi forzare il player video a una velocità fuori standard tramite la console:

```javascript
document.querySelectorAll('video').forEach((v) => (v.playbackRate = 16.0));
```

Questo farà esaurire le tracce rapidamente, simulando ore di ascolto in pochi minuti.

Attendi il trigger del modal nativo. Non appena compare, copia l'intero albero JSON dell'oggetto `action` sputato dalla Web Console e incollalo qui per l'analisi del nodo.

Vuoi procedere con questa attesa passiva o preferisci uno snippet per tentare di alterare il `ytcfg` in memoria abbassando drasticamente la variabile globale del timeout?
