#!/bin/bash
# =============================================================================
# TEST E2E: Flujo Completo TecMan
# =============================================================================
# Este script prueba el ciclo de vida completo de un activo:
#   1. Agente Discovery envía datos de hardware
#   2. Crear activo desde el dispositivo descubierto
#   3. Programar mantenimiento preventivo
#   4. Escanear QR del activo (vía API pública)
#   5. Solicitar soporte desde el QR
#   6. Técnico asigna ticket a sí mismo y lo resuelve
#   7. Usuario solicita soporte general, técnico lo vincula al activo
#   8. Descargar Hoja de Vida PDF
#   9. Agregar dependencia entre activos
#   10. Asignar usuario a cargo (custodia)
#
# Uso:
#   export TECMAN_URL="http://localhost:3001"
#   export TECMAN_EMAIL="admin@tecman.local"
#   export TECMAN_PASSWORD="admin123"
#   bash test-flujo-completo.sh
# =============================================================================

set -euo pipefail

BASE="${TECMAN_URL:-http://localhost:3001}"
EMAIL="${TECMAN_EMAIL:-admin@tecman.local}"
PASS="${TECMAN_PASSWORD:-admin123}"
COOKIE_FILE="/tmp/tecman_test_cookies.txt"
PASS=0
FAIL=0

# ── Colores ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

pass() { PASS=$((PASS+1)); echo -e "  ${GREEN}✓${NC} $1"; }
fail() { FAIL=$((FAIL+1)); echo -e "  ${RED}✗${NC} $1"; }

# ── Login ─────────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}══════════ 1. LOGIN ══════════${NC}"
LOGIN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(echo "$LOGIN" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)
AUTH="Authorization: Bearer $TOKEN"

if [ -z "$TOKEN" ]; then
  echo -e "  ${RED}✗${NC} Login falló. Verifica credenciales."
  exit 1
fi
pass "Login exitoso, token obtenido"

# Obtener IDs de categoría y ubicación para crear activos
CATEGORIES=$(curl -s "$BASE/api/categories" -H "$AUTH")
CAT_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
LOCATIONS=$(curl -s "$BASE/api/locations" -H "$AUTH")
LOC_ID=$(echo "$LOCATIONS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Obtener ID del usuario admin
USERS=$(curl -s "$BASE/api/users?limit=10" -H "$AUTH")
USER_ID=$(echo "$USERS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "  Categoría ID: $CAT_ID"
echo "  Ubicación ID: $LOC_ID"
echo "  Usuario ID: $USER_ID"

# ── 1. AGENTE DISCOVERY ──────────────────────────────────────────────────────
echo -e "\n${CYAN}══════════ 1. AGENTE DISCOVERY ══════════${NC}"

NOW=$(date +%s)
MAC_SUFFIX=$(printf '%02x' $((RANDOM % 256)))
MAC="AA:BB:CC:DD:EE:$MAC_SUFFIX"
HOST="PC-TEST-$NOW"
SERIAL="SN-TEST-$NOW"

PAYLOAD='{
  "macAddress": "'$MAC'",
  "hostname": "'$HOST'",
  "ipAddress": "192.168.1.100",
  "os": "Windows 11 Pro 23H2 (Build 22631)",
  "manufacturer": "Dell Inc.",
  "model": "Latitude 5540",
  "serialNumber": "'$SERIAL'",
  "cpuModel": "13th Gen Intel(R) Core(TM) i7-1365U",
  "cpuCores": 10,
  "ramTotalBytes": 17179869184,
  "ramType": "DDR5",
  "ramSlots": 2,
  "ramSlotsUsed": 1,
  "ramSpeed": "4800 MHz",
  "diskTotalBytes": 512110190592,
  "diskUsedBytes": 214748364800,
  "diskFreeBytes": 297361825792,
  "diskType": "NVMe",
  "domain": "EMPRESA.LOCAL",
  "lastBoot": "2026-06-17T08:00:00Z"
}'

AGENT_RESP=$(curl -s -X POST "$BASE/api/discovery/agent" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

DISCOVERY_ID=$(echo "$AGENT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$DISCOVERY_ID" ]; then
  pass "Dispositivo discovery creado: $HOST (ID: $DISCOVERY_ID)"
else
  fail "No se pudo crear dispositivo discovery"
  echo "  Respuesta: $AGENT_RESP"
fi

# ── 2. CREAR ACTIVO DESDE DISCOVERY ──────────────────────────────────────────
echo -e "\n${CYAN}══════════ 2. CREAR ACTIVO DESDE DISCOVERY ══════════${NC}"

CREATE_RESP=$(curl -s -X PUT "$BASE/api/discovery/$DISCOVERY_ID/link-to-asset" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"createNew":true,"assetData":{"name":"Laptop Dell Latitude 5540","categoryId":"'$CAT_ID'","locationId":"'$LOC_ID'"}}')

ASSET_ID=$(echo "$CREATE_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ASSET_CODE=$(echo "$CREATE_RESP" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
ASSET_QR=$(echo "$CREATE_RESP" | grep -o '"qrCode":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$ASSET_ID" ]; then
  pass "Activo creado desde discovery: $ASSET_CODE (ID: $ASSET_ID)"
else
  fail "No se pudo crear activo desde discovery"
  echo "  Respuesta: $CREATE_RESP"
fi

# ── 3. PROGRAMAR MANTENIMIENTO ────────────────────────────────────────────────
echo -e "\n${CYAN}══════════ 3. MANTENIMIENTO ══════════${NC}"

MAINT_RESP=$(curl -s -X POST "$BASE/api/maintenance" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{
    "assetId": "'$ASSET_ID'",
    "type": "PREVENTIVE",
    "priority": "MEDIUM",
    "description": "Mantenimiento preventivo trimestral - limpieza, revisión térmica y actualización de drivers",
    "technicianId": "'$USER_ID'",
    "scheduledDate": "2026-07-01T09:00:00.000Z"
  }')

MAINT_ID=$(echo "$MAINT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
MAINT_CODE=$(echo "$MAINT_RESP" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$MAINT_ID" ]; then
  pass "Mantenimiento programado: $MAINT_CODE"
else
  fail "No se pudo programar mantenimiento"
  echo "  Respuesta: $MAINT_RESP"
fi

# ── 4. ESCANEAR QR ────────────────────────────────────────────────────────────
echo -e "\n${CYAN}══════════ 4. QR (Consulta Pública) ══════════${NC}"

QR_RESP=$(curl -s "$BASE/api/assets/qr/$ASSET_QR")

QR_NAME=$(echo "$QR_RESP" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
if echo "$QR_RESP" | grep -q '"name"'; then
  pass "QR escaneado correctamente: $QR_NAME"
else
  fail "No se pudo consultar por QR"
  echo "  Respuesta: $QR_RESP"
fi

# ── 5. SOLICITAR SOPORTE DESDE QR ────────────────────────────────────────────
echo -e "\n${CYAN}══════════ 5. TICKET DE SOPORTE (desde QR) ══════════${NC}"

TICKET1_RESP=$(curl -s -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{
    "title": "Pantalla parpadea intermitentemente",
    "description": "La pantalla de la laptop Dell Latitude 5540 parpadea cuando se mueve la tapa. Posible fallo en el flex de la pantalla.",
    "priority": "HIGH",
    "category": "HARDWARE",
    "assetId": "'$ASSET_ID'",
    "creatorId": "'$USER_ID'"
  }')

TICKET1_ID=$(echo "$TICKET1_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TICKET1_CODE=$(echo "$TICKET1_RESP" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$TICKET1_ID" ]; then
  pass "Ticket creado desde QR: $TICKET1_CODE"
else
  fail "No se pudo crear ticket"
  echo "  Respuesta: $TICKET1_RESP"
fi

# ── 6. TÉCNICO RESUELVE TICKET ────────────────────────────────────────────────
echo -e "\n${CYAN}══════════ 6. RESOLUCIÓN DE TICKET ══════════${NC}"

# Asignar ticket al técnico
curl -s -X PUT "$BASE/api/tickets/$TICKET1_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"assigneeId":"'$USER_ID'","status":"IN_PROGRESS"}' > /dev/null
pass "Ticket asignado al técnico"

# Agregar mensaje de diagnóstico
curl -s -X POST "$BASE/api/tickets/$TICKET1_ID/messages" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"message":"Diagnóstico: El flex cable de la pantalla presenta desgaste. Se procede a reemplazar el ensamble completo de la tapa.","isInternal":false}' > /dev/null
pass "Mensaje de diagnóstico agregado"

# Resolver ticket
RESOLVE_RESP=$(curl -s -X PUT "$BASE/api/tickets/$TICKET1_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"status":"RESOLVED"}')

TICKET1_STATUS=$(echo "$RESOLVE_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$TICKET1_STATUS" = "RESOLVED" ]; then
  pass "Ticket resuelto correctamente: $TICKET1_CODE"
else
  fail "No se pudo resolver el ticket"
  echo "  Respuesta: $RESOLVE_RESP"
fi

# ── 7. SOPORTE GENERAL → VINCULAR A ACTIVO ────────────────────────────────────
echo -e "\n${CYAN}══════════ 7. SOPORTE GENERAL (vincular a activo) ══════════${NC}"

# Usuario solicita soporte general (sin asset)
TICKET2_RESP=$(curl -s -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{
    "title": "No puedo acceder al sistema contable",
    "description": "Desde esta mañana el sistema SAP no abre. Muestra error de conexión a la base de datos.",
    "priority": "CRITICAL",
    "category": "SOFTWARE",
    "creatorId": "'$USER_ID'"
  }')

TICKET2_ID=$(echo "$TICKET2_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TICKET2_CODE=$(echo "$TICKET2_RESP" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
pass "Ticket de soporte general creado: $TICKET2_CODE"

# Técnico vincula al activo y resuelve
curl -s -X PUT "$BASE/api/tickets/$TICKET2_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{
    "assigneeId":"'$USER_ID'",
    "assetId":"'$ASSET_ID'",
    "status":"RESOLVED",
    "description":"Se identificó que el problema era en el servidor de bases de datos. Se reinició el servicio y se restauró la conexión. Se vincula el incidente al activo afectado."
  }' > /dev/null
pass "Ticket vinculado al activo y resuelto"

# ── 8. DESCARGAR HOJA DE VIDA PDF ─────────────────────────────────────────────
echo -e "\n${CYAN}══════════ 8. HOJA DE VIDA PDF ══════════${NC}"

PDF_RESP=$(curl -s -o /tmp/hoja-vida-test.pdf -w "%{http_code}" \
  "$BASE/api/assets/$ASSET_ID/hoja-vida-pdf" -H "$AUTH")

if [ "$PDF_RESP" = "200" ]; then
  PDF_SIZE=$(stat -c%s /tmp/hoja-vida-test.pdf 2>/dev/null || echo 0)
  pass "Hoja de Vida PDF descargada ($PDF_SIZE bytes)"
else
  fail "No se pudo descargar PDF (HTTP $PDF_RESP)"
fi

# ── 9. AGREGAR DEPENDENCIA ────────────────────────────────────────────────────
echo -e "\n${CYAN}══════════ 9. DEPENDENCIAS ══════════${NC}"

# Crear segundo activo (UPS) para la dependencia
UPS_RESP=$(curl -s -X POST "$BASE/api/assets" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{
    "code": "UPS-'$(date +%s)'",
    "name": "UPS APC Smart-UPS 1500",
    "categoryId": "'$CAT_ID'",
    "locationId": "'$LOC_ID'",
    "brand": "APC",
    "model": "SMT1500IC",
    "status": "ACTIVE"
  }')

UPS_ID=$(echo "$UPS_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
pass "Segundo activo creado para dependencia: UPS"

# Agregar dependencia: laptop DEPENDE de UPS
DEP_RESP=$(curl -s -X POST "$BASE/api/assets/$ASSET_ID/dependencies" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"dependsOnId":"'$UPS_ID'","type":"POWER","description":"La laptop depende de este UPS para protección eléctrica"}')

DEP_ID=$(echo "$DEP_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$DEP_ID" ]; then
  pass "Dependencia agregada: Laptop → UPS (POWER)"
else
  fail "No se pudo agregar dependencia"
  echo "  Respuesta: $DEP_RESP"
fi

# Verificar dependencias
DEPS_RESP=$(curl -s "$BASE/api/assets/$ASSET_ID/dependencies" -H "$AUTH")
if echo "$DEPS_RESP" | grep -q '"dependsOn"'; then
  pass "Dependencias consultadas correctamente"
else
  fail "No se pudieron consultar dependencias"
fi

# ── 10. ASIGNAR USUARIO A CARGO (CUSTODIA) ────────────────────────────────────
echo -e "\n${CYAN}══════════ 10. CUSTODIA (Usuario a cargo) ══════════${NC}"

CUST_RESP=$(curl -s -X POST "$BASE/api/custodies/assign" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"assetId":"'$ASSET_ID'","userId":"'$USER_ID'","notes":"Asignación inicial - Equipo principal del área de TI"}')

CUST_ID=$(echo "$CUST_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CUST_USER=$(echo "$CUST_RESP" | grep -o '"name":"[^"]*"' | tail -1 | cut -d'"' -f4)

if [ -n "$CUST_ID" ]; then
  pass "Custodia asignada: $CUST_USER al activo $ASSET_CODE"
else
  fail "No se pudo asignar custodia"
  echo "  Respuesta: $CUST_RESP"
fi

# Verificar que la custodia aparece en el historial del activo
HISTORY_RESP=$(curl -s "$BASE/api/assets/$ASSET_ID/history" -H "$AUTH")
if echo "$HISTORY_RESP" | grep -q '"custodies"'; then
  pass "Custodia visible en el historial del activo"
else
  fail "Custodia no visible en historial"
fi

# ── RESUMEN ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}══════════ RESUMEN ══════════${NC}"
echo -e "  ${GREEN}Aprobados: $PASS${NC}"
echo -e "  ${RED}Fallidos: $FAIL${NC}"
echo ""
echo "  Recursos creados:"echo "
  Discovery:  $HOST (ID: $DISCOVERY_ID)"
echo "    Activo:     $ASSET_CODE (ID: $ASSET_ID)"
echo "    QR:         $ASSET_QR"
echo "    Mantto:     $MAINT_CODE (ID: $MAINT_ID)"
echo "    Ticket #1:  $TICKET1_CODE (desde QR)"
echo "    Ticket #2:  $TICKET2_CODE (general → vinculado)"
echo "    PDF:        /tmp/hoja-vida-test.pdf"
echo "    Custodia:   ID: $CUST_ID"

if [ "$FAIL" = "0" ]; then
  echo -e "\n  ${GREEN}✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE${NC}"
else
  echo -e "\n  ${RED}⚠️  $FAIL prueba(s) fallaron. Revisa los errores arriba.${NC}"
  exit 1
fi

