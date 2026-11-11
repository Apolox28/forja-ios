# uso: bash check1.sh "clave:equipo,..."  → choques (malla), física, rangos humanos y coherencia de esos ejercicios
L="$1"; K=$(echo "$L" | tr ',' '\n' | cut -d: -f1 | paste -sd'|')
node meshtest.js "$L" 2>&1 | sed -n '/ATRAVIESA\|SIN CHOQUES/,$p'
node physics_test2.js "C:/Users/sinbr/Desktop/2026/4.- Manual Diseño Operaciones + IA/Claude/Primer Proyecto/Forja-iOS" 2>&1 | grep -E "^($K):|la mano|FALLA" | grep -E "$K"
node romtest.js "$L" 2>&1 | tail -4
node coherence.js 2>&1 | grep -E "$K|COHERENTE|INCOHER"
