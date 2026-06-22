#!/usr/bin/env python3
import sys
import os


# --- Colori ANSI per CLI ---
class C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    MAGENTA = "\033[95m"


def print_usage():
    print(f"\n{C.BOLD}{C.MAGENTA}🌽 CodeCorn Type Restorer{C.RESET}")
    print(f"Ripristina i commenti e i JSDoc da uno script originale a uno sforbiciato.\n")
    print(f"{C.BOLD}Uso:{C.RESET}")
    print(f"  {C.CYAN}python3 cc-restore-types.py{C.RESET} {C.YELLOW}<originale.js> <sforbiciato.js> <output.js>{C.RESET}\n")
    print(f"{C.BOLD}Opzioni:{C.RESET}")
    print(f"  {C.GREEN}-h, --help{C.RESET}    Mostra questo messaggio di aiuto ed esce.\n")
    print(f"{C.BOLD}Esempio:{C.RESET}")
    print(f"  {C.CYAN}python3 cc-restore-types.py{C.RESET} {C.YELLOW}v1_full.js v2_min.js v2_restored.js{C.RESET}\n")


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
        print(f"\n{C.BOLD}{C.RED}❌ Errore:{C.RESET} {C.RED}Uno dei file di input non esiste.{C.RESET}\n")
        sys.exit(1)

    with open(orig_file, "r", encoding="utf-8") as f:
        orig_lines = f.readlines()

    with open(stripped_file, "r", encoding="utf-8") as f:
        stripped_lines = f.readlines()

    print(f"\n{C.CYAN}[*] Analisi del file originale in corso...{C.RESET}")
    comments_map = extract_comments(orig_lines)
    total_blocks = sum(len(v) for v in comments_map.values())
    print(f"{C.CYAN}[*] Trovati {C.BOLD}{total_blocks}{C.RESET}{C.CYAN} blocchi di commenti/JSDoc mappati ad ancore.{C.RESET}")

    output_lines = []
    restored_count = 0
    skipped_count = 0

    in_stripped_block_comment = False
    stripped_comment_buffer = []

    for line in stripped_lines:
        stripped = line.strip()

        # Gestione commenti multiriga preesistenti nel file sforbiciato
        if not in_stripped_block_comment and stripped.startswith("/*"):
            in_stripped_block_comment = True
            stripped_comment_buffer.append(line)
            output_lines.append(line)
            if "*/" in stripped:
                in_stripped_block_comment = False
            continue

        if in_stripped_block_comment:
            stripped_comment_buffer.append(line)
            output_lines.append(line)
            if "*/" in stripped:
                in_stripped_block_comment = False
            continue

        # Gestione commenti singola riga preesistenti nel file sforbiciato
        if stripped.startswith("//"):
            stripped_comment_buffer.append(line)
            output_lines.append(line)
            continue

        # Le righe vuote non invalidano l'associazione del buffer all'ancora successiva
        if not stripped:
            output_lines.append(line)
            continue

        # --- Trovata una riga di codice valida (ancora) ---
        anchor = stripped

        if anchor in comments_map and comments_map[anchor]:
            # Consumiamo sempre il commento in ordine cronologico dalla mappa originale
            orig_comment_block = comments_map[anchor].pop(0)

            # Condizione di sovrascrittura: se lo sforbiciato NON ha commenti a buffer, iniettiamo.
            if not stripped_comment_buffer:
                output_lines.append(orig_comment_block)
                restored_count += 1
            else:
                # Il file sforbiciato possiede già un commento per questa ancora, vince lui.
                skipped_count += 1

        output_lines.append(line)
        stripped_comment_buffer = []  # Reset del buffer locale dopo il parsing dell'ancora

    with open(output_file, "w", encoding="utf-8") as f:
        f.writelines(output_lines)

    print(f"\n{C.GREEN}{C.BOLD}[+] Operazione Completata!{C.RESET}")
    print(f"{C.GREEN}[+] Ripristinati {C.BOLD}{restored_count}{C.RESET}{C.GREEN} su {C.BOLD}{total_blocks}{C.RESET}{C.GREEN} blocchi di commenti/tipi.{C.RESET}")
    if skipped_count > 0:
        print(f"{C.YELLOW}[!] Mantenuti {C.BOLD}{skipped_count}{C.RESET}{C.YELLOW} blocchi nativi dello script sforbiciato (override evitato).{C.RESET}")
    print(f"{C.GREEN}[+] Nuovo file salvato in: {C.BOLD}{C.YELLOW}{output_file}{C.RESET}\n")


if __name__ == "__main__":
    if len(sys.argv) == 1 or sys.argv[1] in ("-h", "--help"):
        print_usage()
        sys.exit(0)

    if len(sys.argv) != 4:
        print(f"\n{C.BOLD}{C.RED}❌ Errore:{C.RESET} {C.RED}Numero di argomenti non valido.{C.RESET}")
        print_usage()
        sys.exit(1)

    restore(sys.argv[1], sys.argv[2], sys.argv[3])
