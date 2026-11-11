SP="$(cd "$(dirname "$0")" && pwd)"
H=$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$2")
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --allow-file-access-from-files --user-data-dir="$(cygpath -w "$SP/edgeprof")" --window-size=640,420 --virtual-time-budget=30000 --hide-scrollbars --screenshot="$(cygpath -w "$SP/$1")" "file:///$SP/bm2.html#$H" 2>/dev/null
