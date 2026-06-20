#!/usr/bin/env python3
import sys
import os


def extract_comments(lines):
    comments_map = {}
    in_block_comment = False
    comment_buffer = []

    for line in lines:
        stripped = line.strip()

        # Gestione commenti multiriga (JSDoc e /* */)
        if not in_block_comment and stripped.startswith("/*"):
            in_block_comment = True
            comment_buffer.append(line)
            if "*/" in stripped:  # Commento aperto e chiuso sulla stessa riga
                in_block_comment = False
            continue

        if in_block_comment:
            comment_buffer.append(line)
            if "*/" in stripped:
                in_block_comment = False
            continue

        # Gestione commenti singola riga (solo se occupano tutta la riga)
        if stripped.startswith("//"):
            comment_buffer.append(line)
            continue

        # Se abbiamo un buffer pieno e troviamo una riga di codice valida (l'ancora)
        if comment_buffer and stripped:
            anchor = stripped
            # Ignoriamo ancore troppo generiche (es. solo una graffa) per evitare falsi positivi
            if len(anchor) > 2:
                if anchor not in comments_map:
                    comments_map[anchor] = []
                # Salviamo il blocco di commenti associato a questa riga di codice
                comments_map[anchor].append("".join(comment_buffer))

            comment_buffer = []  # Reset del buffer

    return comments_map


def restore(orig_file, stripped_file, output_file):
    if not os.path.exists(orig_file) or not os.path.exists(stripped_file):
        print("❌ Errore: Uno dei file di input non esiste.")
        sys.exit(1)

    with open(orig_file, "r", encoding="utf-8") as f:
        orig_lines = f.readlines()

    with open(stripped_file, "r", encoding="utf-8") as f:
        stripped_lines = f.readlines()

    print(f"[*] Analisi del file originale in corso...")
    comments_map = extract_comments(orig_lines)
    total_blocks = sum(len(v) for v in comments_map.values())
    print(f"[*] Trovati {total_blocks} blocchi di commenti/JSDoc mappati ad ancore.")

    output_lines = []
    restored_count = 0

    for line in stripped_lines:
        stripped = line.strip()

        # Se la riga corrente del nuovo file corrisponde a un'ancora mappata
        if stripped in comments_map and comments_map[stripped]:
            # Pop() garantisce l'ordine cronologico se ci sono ancore identiche
            comment_block = comments_map[stripped].pop(0)
            output_lines.append(comment_block)
            restored_count += 1

        output_lines.append(line)

    with open(output_file, "w", encoding="utf-8") as f:
        f.writelines(output_lines)

    print(f"[+] Operazione Completata!")
    print(f"[+] Ripristinati {restored_count} su {total_blocks} blocchi di commenti/tipi.")
    print(f"[+] Nuovo file salvato in: {output_file}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Uso: python3 cc-restore-types.py <file_vecchio_con_commenti.js> <file_nuovo_tagliato.js> <output_ripristinato.js>")
        print("Esempio: python3 cc-restore-types.py script_v1.js script_v2.js script_v2_commentato.js")
        sys.exit(1)

    restore(sys.argv[1], sys.argv[2], sys.argv[3])
