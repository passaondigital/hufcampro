#!/bin/bash
set -e

echo "==> Building hufcampro..."
npm run build

echo "==> Deploying to /var/www/hufcampro/dist..."
rsync -a --delete dist/ /var/www/hufcampro/dist/

echo "==> Done. Live at https://hufcampro.de"
