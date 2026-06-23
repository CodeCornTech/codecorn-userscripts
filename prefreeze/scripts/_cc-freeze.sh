#!/usr/bin/env bash
set -euo pipefail

# --- ANSI Colour Codes ---
readonly C_RESET='\033[0m'
readonly C_INFO='\033[0;36m'
readonly C_SUCCESS='\033[0;32m'
# shellcheck disable=SC2034
readonly C_WARN='\033[0;33m'
# shellcheck disable=SC2034
readonly C_ERROR='\033[0;31m'

readonly SCRIPT_VERSION='2.2.0'
readonly SCRIPT_NAME='CC-USERSCRIPTS-FREEZE'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "$ROOT")"
FREEZE_DIR="$ROOT/_FREEZE"
TMP_DIR="$FREEZE_DIR/.tmp"

cd "$ROOT"

TS="$(date '+%Y%m%d_%H%M%S')"
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'nogit')"

# --- SSOT: Recupero Versione (Legge dal package.json) ---
if [ -f "$ROOT/package.json" ]; then
    STACK_VER="$(grep -m1 '"version":' "$ROOT/package.json" | awk -F'"' '{print $4}' || echo 'unknown')"
elif [ -f "$ROOT/.version" ]; then
    STACK_VER="$(cat "$ROOT/.version" | tr -d '[:space:]')"
else
    STACK_VER="unknown"
fi

FREEZE_NAME="${PROJECT_NAME}_v${STACK_VER}_${TS}_${GIT_SHA}"
STAGE="$TMP_DIR/$FREEZE_NAME"
ARCHIVE="$FREEZE_DIR/${FREEZE_NAME}.tar.gz"
SHA_FILE="$ARCHIVE.sha256"

# --- Centralized Excludes / Prune Rules ---
readonly EXCLUDES_MODE="${EXCLUDES_MODE:-merged}"

# Filtri per l'output del comando `tree`
readonly TREE_EXCLUDES='.git|.DS_Store|_FREEZE|_STASH|_PREV|_DEV|_SHIT|node_modules|dist'

readonly -a SAFETY_RSYNC_EXCLUDES=(
    "--exclude=.git/"
    "--exclude=_FREEZE/"
    "--exclude=_STASH/"
    "--exclude=_DEV/"
    "--exclude=_SHIT/"
    "--exclude=secrets/"
    "--include=.env.*.example"
    "--include=.env.example"
    "--exclude=.env.*"
    "--exclude=.env"
)

readonly -a STATIC_RSYNC_EXCLUDES=(
    "--exclude=node_modules/"
    "--exclude=dist/"
    "--exclude=_PREV/"
    "--exclude=.DS_Store"
    "--exclude=*.log"
    "--exclude=*.zip"
)

GITIGNORE_RSYNC_FILTERS=()
RSYNC_EXCLUDES=()

readonly -a PRUNE_PATHS=(
    "./.git"
    "./_FREEZE"
    "./_STASH"
    "./_PREV"
    "./_DEV"
    "./_SHIT"
    "./node_modules"
    "./dist"
)

log_info() {
    printf '%b\n' "${C_INFO}[freeze] $*${C_RESET}"
}

log_success() {
    printf '%b\n' "${C_SUCCESS}$*${C_RESET}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

append_unique() {
    local target_array_name="$1"
    shift

    local -n target_array="$target_array_name"
    local item
    local existing

    for item in "$@"; do
        [ -n "$item" ] || continue

        for existing in "${target_array[@]}"; do
            [ "$existing" = "$item" ] && continue 2
        done

        target_array+=("$item")
    done
}

build_gitignore_rsync_filters() {
    local gitignore_file="$ROOT/.gitignore"
    local line
    local rule
    local idx
    local -a gitignore_rules=()

    GITIGNORE_RSYNC_FILTERS=()

    [ -f "$gitignore_file" ] || return 0

    while IFS= read -r line || [ -n "$line" ]; do
        line="${line%$'\r'}"

        case "$line" in
        "" | "#"*)
            continue
            ;;
        esac

        gitignore_rules+=("$line")
    done <"$gitignore_file"

    # Git applica "last match wins". Rsync "first match wins".
    for ((idx = ${#gitignore_rules[@]} - 1; idx >= 0; idx--)); do
        rule="${gitignore_rules[$idx]}"

        case "$rule" in
        !*)
            rule="${rule#!}"
            [ -n "$rule" ] || continue
            append_unique GITIGNORE_RSYNC_FILTERS "--include=$rule"
            ;;
        *)
            append_unique GITIGNORE_RSYNC_FILTERS "--exclude=$rule"
            ;;
        esac
    done
}

build_rsync_excludes() {
    RSYNC_EXCLUDES=()
    append_unique RSYNC_EXCLUDES "${SAFETY_RSYNC_EXCLUDES[@]}"

    case "$EXCLUDES_MODE" in
    static)
        append_unique RSYNC_EXCLUDES "${STATIC_RSYNC_EXCLUDES[@]}"
        ;;
    gitignore)
        build_gitignore_rsync_filters
        append_unique RSYNC_EXCLUDES "${GITIGNORE_RSYNC_FILTERS[@]}"
        ;;
    merged)
        build_gitignore_rsync_filters
        append_unique RSYNC_EXCLUDES "${GITIGNORE_RSYNC_FILTERS[@]}"
        append_unique RSYNC_EXCLUDES "${STATIC_RSYNC_EXCLUDES[@]}"
        ;;
    *)
        printf '%b\n' "${C_ERROR}[freeze] Invalid EXCLUDES_MODE: ${EXCLUDES_MODE}${C_RESET}" >&2
        exit 1
        ;;
    esac
}

find_pruned() {
    local -a cmd=(find .)
    local path
    local first=1

    cmd+=('(')
    for path in "${PRUNE_PATHS[@]}"; do
        if ((first)); then
            cmd+=(-path "$path")
            first=0
        else
            cmd+=(-o -path "$path")
        fi
    done
    cmd+=(')' -prune -o "$@")

    "${cmd[@]}"
}

prepare_dirs() {
    mkdir -p "$FREEZE_DIR" "$TMP_DIR"
    rm -rf "$STAGE"
    mkdir -p "$STAGE"
}

stage_project() {
    log_info "Staging CodeCorn project..."
    rsync -av ./ "$STAGE/" "${RSYNC_EXCLUDES[@]}" >/dev/null
}

write_git_artifacts() {
    log_info "Generating Git Patch (Uncommitted changes)..."

    git diff -- . >"$STAGE/_GIT_DIFF_WORKTREE.patch" || true
    git diff --cached -- . >"$STAGE/_GIT_DIFF_STAGED.patch" || true

    git ls-files --others --exclude-standard \
        | grep -Ev '^_FREEZE(/|$)' \
            >"$STAGE/_GIT_UNTRACKED.txt" || true
}

manifest_header() {
    echo "# CodeCorn Stack - Freeze Manifest"
    echo
    echo "Script: $SCRIPT_NAME"
    echo "Script Version: $SCRIPT_VERSION"
    echo "Project: $PROJECT_NAME"
    echo "Version: $STACK_VER"
    echo "Created: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "Path: $ROOT"
    echo "Git SHA: $GIT_SHA"
    echo "Exclude Mode: $EXCLUDES_MODE"
}

manifest_git() {
    echo
    echo "## Git status"
    git status --short | grep -Ev '^[? MADRCU]{2} _FREEZE(/|$)' || true

    echo
    echo "## Git branch"
    git branch --show-current || true

    echo
    echo "## Git remotes"
    git remote -v || true
}

manifest_tree() {
    echo
    echo "## Tree (Cleaned)"

    if command_exists tree; then
        tree -I "$TREE_EXCLUDES" . || true
    else
        find_pruned -type f ! -name '.DS_Store' -print | sort || true
    fi
}

manifest_symlinks() {
    local symlink_path
    local symlink_target

    echo
    echo "## Symlinks"
    find_pruned -type l -exec ls -la {} \; || true

    echo
    echo "## Absolute symlinks"

    while IFS= read -r symlink_path; do
        symlink_target="$(readlink "$symlink_path" 2>/dev/null || true)"

        case "$symlink_target" in
        /*)
            printf "%s -> %s\n" "$symlink_path" "$symlink_target"
            ;;
        esac
    done < <(find_pruned -type l -print || true)
}

write_manifest() {
    log_info "Generating Manifest..."

    {
        manifest_header
        manifest_git
        manifest_tree
        manifest_symlinks
    } >"$STAGE/_FREEZE_MANIFEST.txt"
}

create_archive() {
    log_info "Creating archive..."
    tar -czf "$ARCHIVE" -C "$TMP_DIR" "$FREEZE_NAME"
}

write_checksum() {
    log_info "Writing checksum..."

    if command_exists shasum; then
        (
            cd "$(dirname "$ARCHIVE")"
            shasum -a 256 "$(basename "$ARCHIVE")" >"$(basename "$SHA_FILE")"
        )
    else
        (
            cd "$(dirname "$ARCHIVE")"
            sha256sum "$(basename "$ARCHIVE")" >"$(basename "$SHA_FILE")"
        )
    fi
}

cleanup_stage() {
    rm -rf "$STAGE"
}

open_finder() {
    if [[ "${OSTYPE:-}" == "darwin"* ]]; then
        log_info "Launching Finder with freeze dir..."
        open -R "$ARCHIVE" || true
    fi
}

print_result() {
    echo
    log_success "[OK] Freeze created successfully!"
    printf '%b\n' "${C_INFO}Archive:${C_RESET} $ARCHIVE"
    printf '%b\n' "${C_INFO}SHA256: ${C_RESET} $(awk '{print $1}' "$SHA_FILE")"
    echo
}

main() {
    echo
    log_info "$SCRIPT_NAME - VERSION: v$SCRIPT_VERSION"
    log_info "EXCLUDES_MODE=${EXCLUDES_MODE}"
    echo

    build_rsync_excludes
    prepare_dirs
    stage_project
    write_manifest
    write_git_artifacts
    create_archive
    write_checksum
    cleanup_stage
    print_result
    open_finder
}

main "$@"
exit 0