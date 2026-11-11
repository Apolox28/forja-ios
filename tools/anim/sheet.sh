# uso: sheet.sh salida.png "lista" "fases" vista [ancho alto tamaño]
SP="$(cd "$(dirname "$0")" && pwd)"
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --allow-file-access-from-files --user-data-dir="$(cygpath -w "$SP/edgeprof")" --window-size=${5:-1340},${6:-1000} --virtual-time-budget=60000 --hide-scrollbars --screenshot="$(cygpath -w "$SP/$1")" "file:///$SP/pm3d.html?s=${7:-158}&ph=$3&v=$4#$2" 2>/dev/null
