#!/bin/bash
# Corre en la Mac de GitHub después de compilar: instala Meneia en un simulador de iPhone,
# la abre y saca capturas mientras recorre las pestañas (4 a 28 s) y una más a los 40 s. Compilar no alcanza: una app puede compilar y abrir en blanco.
set -euo pipefail
mkdir -p evidence
APP="build/Build/Products/Debug-iphonesimulator/App.app"
BUNDLE=com.unbiraapps.meneia
test -d "$APP"
DEVICE=$(xcrun simctl list devices available -j | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next(x["udid"] for rt,a in sorted(d["devices"].items(), reverse=True) for x in a if x.get("isAvailable") and x["name"].startswith("iPhone")))')
xcrun simctl boot "$DEVICE" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE" -b
xcrun simctl install "$DEVICE" "$APP"
# Recién encendido, el simulador a veces rechaza abrir apps ("denied by service delegate"): se reintenta.
sleep 15
for try in 1 2 3 4 5; do
  if xcrun simctl launch --stdout="$PWD/evidence/app-stdout.txt" --stderr="$PWD/evidence/app-stderr.txt" "$DEVICE" "$BUNDLE" > evidence/launch.txt 2> evidence/launch-error.txt; then break; fi
  echo "Intento $try: el simulador todavía no deja abrir la app"; cat evidence/launch-error.txt | head -3
  [ "$try" = 5 ] && { echo "No se pudo abrir la app"; exit 1; }
  sleep 20
done
START=$(date +%s)
# La compilación de capturas cambia de pestaña cada 8 s desde que carga la página: Hoy, Calendario, Historial, Salud, Perfil.
for at in 7 15 23 31 39 46; do
  wait=$(( START + at - $(date +%s) )); if [ "$wait" -gt 0 ]; then sleep "$wait"; fi
  xcrun simctl io "$DEVICE" screenshot "evidence/iphone-${at}s.png"
  echo "${at}s: captura tomada" | tee -a evidence/resultado.txt
done
find "$HOME/Library/Logs/DiagnosticReports" -name 'App*.ips' -newermt "@$START" -exec cp {} evidence/ \; 2>/dev/null || true
echo "Modelo: $(xcrun simctl list devices -j | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next(x["name"] for a in d["devices"].values() for x in a if x["udid"]==sys.argv[1]))' "$DEVICE")" | tee -a evidence/resultado.txt
# Si la app se cerró sola, iOS deja un informe de fallo (.ips): eso sí es un error.
if ls evidence/*.ips >/dev/null 2>&1; then echo "La app se cerró sola: hay un informe de fallo en evidence/"; exit 1; fi
echo "Sin informes de fallo" | tee -a evidence/resultado.txt
