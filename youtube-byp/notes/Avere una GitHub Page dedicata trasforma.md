Avere una GitHub Page dedicata trasforma la tua repository in una vera e propria "App Store" privata. Gli utenti (e tu stesso da altri PC) potranno sfogliare gli script e installarli con un clic, senza dover spulciare nel codice sorgente della repo.

Dato che i tool come il *God Mode* hanno uno stile molto "dark/hacker/admin", ho preparato un `index.html` a singola pagina che usa **Tailwind CSS** (tramite CDN, così non devi installare nulla) per darti una UI moderna, scura e super responsiva in pochi secondi.

### 1. Il file `index.html`

Crea un file chiamato `index.html` nella root della tua repository (accanto al `package.json`) e incolla questo codice. Ho già inserito i percorsi corretti per il branch `main` della tua repo `CodeCornTech`.

```html


```

### 2. Pusha il codice

Apri il terminale nella root del progetto:

```bash
git add index.html
git commit -m "✨ Aggiunta landing page per GitHub Pages"
git push origin main

```

### 3. Attiva GitHub Pages

1. Vai sulla pagina della tua repository su GitHub (`https://github.com/CodeCornTech/codecorn-userscripts`).
2. Clicca su **Settings** (l'icona dell'ingranaggio in alto).
3. Nel menu di sinistra, scorri giù fino alla sezione "Code and automation" e clicca su **Pages**.
4. Sotto **Build and deployment**:
* **Source**: Lascia "Deploy from a branch".
* **Branch**: Seleziona `main` e assicurati che la cartella sia `/ (root)`.


5. Clicca su **Save**.

Entro 1-2 minuti, la tua "vetrina" degli script sarà pubblica all'URL:
`https://CodeCornTech.github.io/codecorn-userscripts/`

Quando tu (o il tuo team) cliccherete su **"⚡ Installa"** dalla pagina web, il link punterà al file `.user.js` in formato *Raw*, e Tampermonkey lo intercetterà aprendo automaticamente la finestra di installazione. Aggiungendo un nuovo script alla repo, ti basterà duplicare un blocco `<div class="bg-dark ...">` nell'`index.html` e cambiare i percorsi.