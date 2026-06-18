ccCopy(
    console.log(
        (() => {
            const modal = document.querySelector('ytmusic-you-there-renderer');

            if (!modal) {
                console.error('❌ Modal non trovato nel DOM!');
                return;
            }

            const style = window.getComputedStyle(modal);
            const parent = modal.parentElement;
            const parentStyle = parent ? window.getComputedStyle(parent) : null;

            console.log('🔍 --- SNAPSHOT MODAL ---');

            console.table({
                '1. Modal Display': style.display,
                '2. Modal Visibility': style.visibility,
                '3. Modal Opacity': style.opacity,
                '4. Modal Z-Index': style.zIndex,
                '5. Modal Pointer-Events': style.pointerEvents,
            });

            console.log(
                '🏷️ Attributi Modal:',
                Array.from(modal.attributes)
                    .map((a) => `${a.name}="${a.value}"`)
                    .join(' | ') || 'Nessun attributo',
            );

            if (parent) {
                console.log('\n📦 --- ANALISI CONTENITORE PADRE ---');
                console.log('Tag:', parent.tagName);
                console.table({
                    '1. Parent Display': parentStyle.display,
                    '2. Parent Visibility': parentStyle.visibility,
                    '3. Parent Opacity': parentStyle.opacity,
                });
                console.log(
                    '🏷️ Attributi Padre:',
                    Array.from(parent.attributes)
                        .map((a) => `${a.name}="${a.value}"`)
                        .join(' | ') || 'Nessun attributo',
                );
            }
        })(),
    ),
);
