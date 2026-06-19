//@ts-nocheck
ccCopy(
    (() => {
        const modal = document.querySelector('ytmusic-you-there-renderer');

        if (!modal) {
            console.error('❌ Modal non trovato nel DOM!');
            return '❌ Modal non trovato nel DOM!';
        }

        const style = window.getComputedStyle(modal);
        const parent = modal.parentElement;
        const parentStyle = parent ? window.getComputedStyle(parent) : null;

        // Inizializziamo l'output testuale da copiare
        let clipboardOutput = '🔍 --- SNAPSHOT MODAL ---\n';

        const modalProps = {
            '1. Modal Display': style.display,
            '2. Modal Visibility': style.visibility,
            '3. Modal Opacity': style.opacity,
            '4. Modal Z-Index': style.zIndex,
            '5. Modal Pointer-Events': style.pointerEvents,
        };
        
        console.log('🔍 --- SNAPSHOT MODAL ---');
        console.table(modalProps);
        
        clipboardOutput += JSON.stringify(modalProps, null, 2) + '\n\n';

        const modalAttrs = Array.from(modal.attributes)
            .map((a) => `${a.name}="${a.value}"`)
            .join(' | ') || 'Nessun attributo';
            
        console.log('🏷️ Attributi Modal:', modalAttrs);
        clipboardOutput += `🏷️ Attributi Modal: ${modalAttrs}\n\n`;

        if (parent) {
            console.log('\n📦 --- ANALISI CONTENITORE PADRE ---');
            console.log('Tag:', parent.tagName);
            
            clipboardOutput += '📦 --- ANALISI CONTENITORE PADRE ---\n';
            clipboardOutput += `Tag: ${parent.tagName}\n`;

            const parentProps = {
                '1. Parent Display': parentStyle.display,
                '2. Parent Visibility': parentStyle.visibility,
                '3. Parent Opacity': parentStyle.opacity,
            };
            
            console.table(parentProps);
            clipboardOutput += JSON.stringify(parentProps, null, 2) + '\n\n';

            const parentAttrs = Array.from(parent.attributes)
                .map((a) => `${a.name}="${a.value}"`)
                .join(' | ') || 'Nessun attributo';
                
            console.log('🏷️ Attributi Padre:', parentAttrs);
            clipboardOutput += `🏷️ Attributi Padre: ${parentAttrs}`;
        }

        // Ritorna la stringa finale costruita, che ccCopy prenderà in pasto
        return clipboardOutput;
    })()
);