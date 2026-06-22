// scripts/release.js
const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];
if (!newVersion || !/^\d+\.\d+\.\d+/.test(newVersion)) {
    console.error('❌ Errore: Inserisci una versione valida (es: npm run release 4.15.0)');
    process.exit(1);
}

const ROOT = path.resolve(__dirname, '../');

const filesToUpdate = [
    {
        name: 'god-mode-console/CodeCorn_GodMode.user.js',
        replacements: [
            { regex: /(\/\/ @version\s+)\d+\.\d+\.\d+/g, replace: `$1${newVersion}` },
            {
                regex: /(CodeCorn Console Capture \(God Mode v)\d+\.\d+\.\d+(\))/g,
                replace: `$1${newVersion}$2`,
            },
            {
                regex: /(version:\s*["'])\d+\.\d+\.\d+(["'])/g,
                replace: `$1${newVersion}$2`,
            },
            {
                regex: /(God Mode v)\d+\.\d+\.\d+( Inizializzato!)/g,
                replace: `$1${newVersion}$2`,
            },
        ],
    },
    {
        name: 'index.html',
        replacements: [
            // Cerca la badge span della versione del God Mode e la rimpiazza
            {
                regex: /(<span class="[^"]*text-emerald-400[^"]*">v)\d+\.\d+\.\d+(<\/span>)/g,
                replace: `$1${newVersion}$2`,
            },
        ],
    },
    {
        name: 'README.md',
        replacements: [
            {
                regex: /(\|\s*\*\*God Mode Console Capture\*\*\s*\|\s*`v)\d+\.\d+\.\d+(`\s*\|)/g,
                replace: `$1${newVersion}$2`,
            },
        ],
    },
    {
        name: 'package.json',
        replacements: [
            {
                regex: /("version":\s*")\d+\.\d+\.\d+(")/g,
                replace: `$1${newVersion}$2`,
            },
        ],
    },
];

let successCount = 0;

filesToUpdate.forEach((fileDef) => {
    const filePath = path.join(ROOT, fileDef.name);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = content;

        fileDef.replacements.forEach((rep) => {
            updated = updated.replace(rep.regex, rep.replace);
        });

        if (content !== updated) {
            fs.writeFileSync(filePath, updated, 'utf8');
            console.log(`✅ Aggiornato: ${fileDef.name}`);
            successCount++;
        } else {
            console.log(`⚠️ Nessun match trovato in: ${fileDef.name} (forse già aggiornato?)`);
        }
    } else {
        console.error(`❌ File non trovato: ${filePath}`);
    }
});

console.log(`\n🎉 Release v${newVersion} completata! File toccati: ${successCount}.`);
console.log(`🚀 Puoi lanciare 'npm run build:godmode' per minimizzarlo.`);
