#!/bin/bash
# Corre en la Mac de GitHub después de compilar: instala Meneia en un simulador de iPhone,
# la abre una vez por pantalla y saca capturas. Compilar no alcanza: una app puede compilar y abrir en blanco.
set -euo pipefail
mkdir -p evidence
APP="build/Build/Products/Debug-iphonesimulator/App.app"
BUNDLE=com.unbiraapps.meneia
test -d "$APP"
# iPhone de 6,9 pulgadas (Pro Max): sus capturas (1320×2868) son las que pide el App Store.
DEVICE=$(xcrun simctl list devices available -j | python3 -c '
import json,sys
d=json.load(sys.stdin)
devs=[x for rt,a in sorted(d["devices"].items(), reverse=True) for x in a if x.get("isAvailable") and x["name"].startswith("iPhone")]
pm=[x for x in devs if "Pro Max" in x["name"]]
print((pm or devs)[0]["udid"])')
xcrun simctl boot "$DEVICE" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE" -b
# Simulador en español de Argentina (fechas y textos del sistema), y se reinicia para que tome el cambio
xcrun simctl spawn "$DEVICE" defaults write .GlobalPreferences AppleLanguages -array es-AR es
xcrun simctl spawn "$DEVICE" defaults write .GlobalPreferences AppleLocale -string es_AR
xcrun simctl shutdown "$DEVICE"
xcrun simctl boot "$DEVICE"
xcrun simctl bootstatus "$DEVICE" -b
# Barra de estado prolija para las capturas de la tienda
xcrun simctl status_bar "$DEVICE" override --time "9:41" --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularMode active --cellularBars 4 || true
xcrun simctl install "$DEVICE" "$APP"
# Para cada pantalla: escribe la pestaña en demo-tab.txt dentro de la app, la reinstala (los datos quedan) y la abre.
# Recién encendido, el simulador a veces rechaza abrir apps ("denied by service delegate"): se reintenta.
START=$(date +%s)
sleep 15
n=1
for t in hoy calendario historial familia salud perfil; do
  echo "$t" > "$APP/public/demo-tab.txt"
  xcrun simctl terminate "$DEVICE" "$BUNDLE" 2>/dev/null || true
  xcrun simctl install "$DEVICE" "$APP"
  for try in 1 2 3 4 5; do
    if xcrun simctl launch "$DEVICE" "$BUNDLE" > evidence/launch.txt 2> evidence/launch-error.txt; then break; fi
    echo "Intento $try: el simulador todavía no deja abrir la app"; head -3 evidence/launch-error.txt
    [ "$try" = 5 ] && { echo "No se pudo abrir la app"; exit 1; }
    sleep 20
  done
  # La primera vez la vista web tarda más en cargar
  if [ "$n" = 1 ]; then sleep 25; else sleep 12; fi
  xcrun simctl io "$DEVICE" screenshot "evidence/iphone-$n-$t.png"; echo "$t: captura tomada" | tee -a evidence/resultado.txt
  n=$((n+1))
done
# Al rato de encender, iOS muestra avisos propios: la captura del calendario se repite al final, ya sin avisos.
sleep 20
echo "calendario" > "$APP/public/demo-tab.txt"
xcrun simctl terminate "$DEVICE" "$BUNDLE" 2>/dev/null || true
xcrun simctl install "$DEVICE" "$APP"
xcrun simctl launch "$DEVICE" "$BUNDLE" > /dev/null
sleep 12
xcrun simctl io "$DEVICE" screenshot "evidence/iphone-2-calendario.png"; echo "calendario (repetida): captura tomada" | tee -a evidence/resultado.txt
find "$HOME/Library/Logs/DiagnosticReports" -name 'App*.ips' -newermt "@$START" -exec cp {} evidence/ \; 2>/dev/null || true
echo "Modelo: $(xcrun simctl list devices -j | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next(x["name"] for a in d["devices"].values() for x in a if x["udid"]==sys.argv[1]))' "$DEVICE")" | tee -a evidence/resultado.txt
# Si la app se cerró sola, iOS deja un informe de fallo (.ips): eso sí es un error.
if ls evidence/*.ips >/dev/null 2>&1; then echo "La app se cerró sola: hay un informe de fallo en evidence/"; exit 1; fi
echo "Sin informes de fallo" | tee -a evidence/resultado.txt
