#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Punto di verità assoluto
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const newVersion = pkg.version;

// Array dei file da sincronizzare
const targetFiles = [
    'god-mode-console/CodeCorn_GodMode.user.js',
    'youtube-byp/ytbyp.user.js'
];

let updatedCount = 0;

targetFiles.forEach((relPath) => {
    const filePath = path.join(__dirname, '..', relPath);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`[SKIP] File non trovato: ${relPath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // 1. Aggiorna header Tampermonkey: // @version 1.2.3
    const headerRegex = /(\/\/\s*@version\s+)\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?/g;
    if (headerRegex.test(content)) {
        content = content.replace(headerRegex, `$1${newVersion}`);
        hasChanges = true;
    }

    // 2. Aggiorna costante JS: const VERSION = "1.2.3";
    const constRegex = /(const\s+VERSION\s*=\s*['"])\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?(['"])/g;
    if (constRegex.test(content)) {
        content = content.replace(constRegex, `$1${newVersion}$2`);
        hasChanges = true;
    }

    if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[OK] Sincronizzato ${relPath} -> v${newVersion}`);
        updatedCount++;
    }
});

if (updatedCount > 0) {
    console.log(`\n✅ Sync completato. ${updatedCount} script aggiornati alla versione ${newVersion}.`);
} else {
    console.log(`\nℹ️ Nessuna modifica necessaria o file non corrispondenti ai regex.`);
}