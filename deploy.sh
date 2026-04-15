#!/bin/bash
set -e
echo ">>> Build..."
npm run build
echo ">>> Push..."
git add -A
git commit -m "deploy $(date +%Y-%m-%d)"
git push origin main
echo ""
echo "✅ Deploy completato!"
echo "→ https://www.alessandropezzali.it/djapp/"
