#!/bin/sh
set -eu

export WIKIART_CATALOGO="${WIKIART_CATALOGO:-/app/deploy/catalogo/classes.csv}"
export WIKIART_THUMBNAILS="${WIKIART_THUMBNAILS:-/tmp/wikiart/thumbnails}"
export SERVER_PORT="${PORT:-${SERVER_PORT:-8080}}"

if [ ! -f "$WIKIART_CATALOGO" ]; then
    if [ -z "${WIKIART_CATALOGO_URL:-}" ]; then
        echo "Defina WIKIART_CATALOGO_URL com a URL HTTPS de classes.csv.gz." >&2
        exit 1
    fi
    mkdir -p "$(dirname "$WIKIART_CATALOGO")"
    download_dir=$(mktemp -d "$(dirname "$WIKIART_CATALOGO")/download.XXXXXX")
    trap 'rm -rf "$download_dir"' EXIT
    echo "Baixando o catálogo externo..."
    curl --fail --silent --show-error --location \
        --proto '=https' --proto-redir '=https' \
        --retry 3 --connect-timeout 15 --max-time 180 \
        --output "$download_dir/classes.csv.gz" "$WIKIART_CATALOGO_URL"
    gzip -dc "$download_dir/classes.csv.gz" > "$download_dir/classes.csv"
    if [ ! -s "$download_dir/classes.csv" ]; then
        echo "O catálogo baixado está vazio." >&2
        exit 1
    fi
    if [ -n "${WIKIART_CATALOGO_SHA256:-}" ]; then
        if ! printf '%s  %s\n' "$WIKIART_CATALOGO_SHA256" "$download_dir/classes.csv" \
            | sha256sum --check --status; then
            echo "O SHA-256 do catálogo baixado não corresponde ao configurado." >&2
            exit 1
        fi
    fi
    mv "$download_dir/classes.csv" "$WIKIART_CATALOGO"
    rm -rf "$download_dir"
    trap - EXIT
fi

exec java -jar /app/app.jar
