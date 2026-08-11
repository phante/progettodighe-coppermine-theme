#!/usr/bin/env bash
# Gira la suite su ogni riga di test/versions.txt: è il test dell'aggiornamento
# di Coppermine, non solo delle modifiche al tema.
#
# Un fallimento non ferma le righe successive — sapere che 1.6.29 si rompe ma
# 1.6.19 no è esattamente l'informazione che serve.
set -uo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE="${COMPOSE:-podman-compose}"
esiti=()

# La lista arriva sul descriptor 3, non su stdin: podman-compose e playwright
# leggono stdin e si mangerebbero le righe rimanenti, facendo girare la matrice
# solo sulla prima versione.
while read -r cpg php <&3; do
    [[ -z "${cpg:-}" || "$cpg" == \#* ]] && continue

    echo
    echo "########## Coppermine $cpg su php:$php"
    export CPG_VERSION="$cpg" PHP_TAG="$php"

    $COMPOSE -f "$TEST_DIR/compose.yml" down -v >/dev/null 2>&1
    if $COMPOSE -f "$TEST_DIR/compose.yml" up --build -d \
        && "$TEST_DIR/bin/install.sh" \
        && npx playwright test; then
        esiti+=("OK   $cpg (php $php)")
    else
        esiti+=("FAIL $cpg (php $php)")
    fi
    $COMPOSE -f "$TEST_DIR/compose.yml" down -v >/dev/null 2>&1
done 3< "$TEST_DIR/versions.txt"

echo
echo "########## riepilogo"
printf '%s\n' "${esiti[@]}"
printf '%s\n' "${esiti[@]}" | grep -q '^FAIL' && exit 1
exit 0
