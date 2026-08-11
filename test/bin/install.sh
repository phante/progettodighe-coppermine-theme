#!/usr/bin/env bash
# Installa Coppermine nel container di test e lo popola con un minimo di
# contenuto, senza passare da install.php.
#
# Il tarball porta già sql/schema.sql e sql/basic.sql: caricarli a mano è
# deterministico e dura un paio di secondi, mentre pilotare l'installer web con
# curl significa inseguire i suoi campi form a ogni versione di Coppermine —
# cioè proprio la cosa che la matrice di versioni dovrebbe poter cambiare senza
# rompersi.
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/compose.yml"
COMPOSE="${COMPOSE:-podman-compose}"
PREFIX="cpg16x_"

run_cpg() { $COMPOSE -f "$COMPOSE_FILE" exec -T cpg "$@"; }
run_sql() { $COMPOSE -f "$COMPOSE_FILE" exec -T db mariadb -ucpg -pcpg cpg; }

echo "==> attendo il database"
for _ in $(seq 1 40); do
    if echo 'SELECT 1' | run_sql >/dev/null 2>&1; then break; fi
    sleep 1
done
echo 'SELECT 1' | run_sql >/dev/null

echo "==> carico schema e dati di base"
# CPG_ è il segnaposto che l'installer sostituisce con TABLE_PREFIX.
for f in schema basic; do
    run_cpg sed "s/CPG_/${PREFIX}/g" "/var/www/html/sql/${f}.sql" | run_sql
done

echo "==> scrivo include/config.inc.php"
run_cpg tee /var/www/html/include/config.inc.php >/dev/null <<'PHP'
<?php
// Generato da test/bin/install.sh — ambiente di test, non è il config di produzione.
$CONFIG['dbtype'] =                 'mysqli';
$CONFIG['dbserver'] =               'db';
$CONFIG['dbuser'] =                 'cpg';
$CONFIG['dbpass'] =                 'cpg';
$CONFIG['dbname'] =                 'cpg';
$CONFIG['TABLE_PREFIX'] =           'cpg16x_';
PHP

echo "==> copio le immagini di esempio"
# Tre file già presenti nel tarball. Coppermine si aspetta accanto all'originale
# un thumb_ e un normal_: qui sono la stessa immagine, ai test della scocca
# interessa che l'URL risponda 200, non che la miniatura sia scalata.
run_cpg bash -c '
set -e
d=/var/www/html/albums/userpics/10001
mkdir -p "$d"
i=1
for src in jpgtest.jpg combined.jpg scaled.jpg; do
    cp "/var/www/html/images/install/$src" "$d/pic$i.jpg"
    cp "$d/pic$i.jpg" "$d/thumb_pic$i.jpg"
    cp "$d/pic$i.jpg" "$d/normal_pic$i.jpg"
    i=$((i + 1))
done
chown -R www-data:www-data /var/www/html/albums
'

echo "==> semino categoria, album e foto"
run_sql <<SQL
SET @cat = 2;
INSERT INTO ${PREFIX}categories (cid, name, description, pos, parent, lft, rgt, depth)
    VALUES (@cat, 'Dighe', 'Categoria di prova', 1, 0, 3, 4, 1);
INSERT INTO ${PREFIX}albums (aid, title, description, category, visibility, thumb, pos)
    VALUES (1, 'Album di prova', 'Album seminato da install.sh', @cat, 0, 1, 1);
INSERT INTO ${PREFIX}pictures (pid, aid, filepath, filename, filesize, total_filesize, pwidth, pheight, ctime, owner_id, title, caption, approved, mtime)
    VALUES
    (1, 1, 'userpics/10001/', 'pic1.jpg', 10000, 30000, 800, 600, UNIX_TIMESTAMP(), 1, 'Prima foto',  'Didascalia 1', 'YES', NOW()),
    (2, 1, 'userpics/10001/', 'pic2.jpg', 10000, 30000, 800, 600, UNIX_TIMESTAMP(), 1, 'Seconda foto', 'Didascalia 2', 'YES', NOW()),
    (3, 1, 'userpics/10001/', 'pic3.jpg', 10000, 30000, 800, 600, UNIX_TIMESTAMP(), 1, 'Terza foto',   'Didascalia 3', 'YES', NOW());

UPDATE ${PREFIX}config SET value = 'progettodighe' WHERE name = 'theme';
UPDATE ${PREFIX}config SET value = 'ProgettoDighe' WHERE name = 'gallery_name';
UPDATE ${PREFIX}config SET value = 'Il punto di riferimento per gli appassionati di dighe, centrali idroelettriche e opere idrauliche.' WHERE name = 'gallery_description';
SQL

echo "==> fatto: http://127.0.0.1:${CPG_PORT:-8088}/"
