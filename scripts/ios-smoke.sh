#!/bin/bash
# Corre en la Mac de GitHub después de compilar: instala Meneia en un simulador de iPhone,
# la abre y saca capturas a los 8, 20 y 40 segundos. Compilar no alcanza: una app puede compilar y abrir en blanco.
set -euo pipefail
mkdir -p evidence
APP="build/Build/Products/Debug-iphonesimulator/App.app"
BUNDLE=com.unbiraapps.meneia
test -d "$APP"
DEVICE=$(xcrun simctl list devices available -j | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next(x["udid"] for rt,a in sorted(d["devices"].items(), reverse=True) for x in a if x.get("isAvailable") and x["name"].startswith("iPhone")))')
xcrun simctl boot "$DEVICE" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE" -b
xcrun simctl install "$DEVICE" "$APP"
START=$(date +%s)
xcrun simctl launch --stdout="evidence/app-stdout.txt" --stderr="evidence/app-stderr.txt" "$DEVICE" "$BUNDLE" > evidence/launch.txt
for at in 8 20 40; do
  wait=$(( START + at - $(date +%s) )); if [ "$wait" -gt 0 ]; then sleep "$wait"; fi
  xcrun simctl io "$DEVICE" screenshot "evidence/iphone-${at}s.png"
  if xcrun simctl spawn "$DEVICE" launchctl list 2>/dev/null | grep -q "$BUNDLE"; then echo "${at}s: abierta" ; else echo "${at}s: NO está corriendo"; fi | tee -a evidence/resultado.txt
done
find "$HOME/Library/Logs/DiagnosticReports" -name 'App*.ips' -newermt "@$START" -exec cp {} evidence/ \; 2>/dev/null || true
echo "Modelo: $(xcrun simctl list devices -j | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next(x["name"] for a in d["devices"].values() for x in a if x["udid"]==sys.argv[1]))' "$DEVICE")" | tee -a evidence/resultado.txt
grep -q "NO está corriendo" evidence/resultado.txt && { echo "La app se cerró sola: revisar evidence/"; exit 1; } || true
