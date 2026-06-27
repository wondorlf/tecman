import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Knowledge Base...');

  const categories = [
    { name: 'Computadores', slug: 'computadores', icon: '💻', order: 1 },
    { name: 'Impresoras', slug: 'impresoras', icon: '🖨️', order: 2 },
    { name: 'Redes', slug: 'redes', icon: '🌐', order: 3 },
    { name: 'Biomédico', slug: 'biomedico', icon: '🏥', order: 4 },
    { name: 'Energía', slug: 'energia', icon: '⚡', order: 5 },
    { name: 'Soporte General', slug: 'soporte-general', icon: '🎧', order: 6 },
    { name: 'Software y Aplicaciones', slug: 'software', icon: '📦', order: 7 },
    { name: 'Accesos y Seguridad', slug: 'accesos', icon: '🔐', order: 8 },
  ];

  const createdCategories: Record<string, string> = {};

  for (const cat of categories) {
    const created = await prisma.knowledgeCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
    console.log(`  ✓ Categoría: ${cat.name}`);
  }

  const articles = [
    {
      title: 'El equipo está muy lento o tarda en encender',
      slug: 'equipo-lento-arranque',
      excerpt: 'Guía paso a paso para recuperar la velocidad de un equipo Windows o Linux.',
      content: `
# El equipo está muy lento o tarda en encender

## Síntomas comunes
- Tiempo de arranque mayor a 3 minutos.
- Apertura de programas con retraso.
- Congelamientos momentáneos.

## Causas frecuentes
1. **Malware o virus** en segundo plano.
2. **Programas de inicio** innecesarios.
3. **Disco casi lleno** (menos del 10% libre).
4. **Falta de actualizaciones** del sistema o drivers.
5. **RAM insuficiente** para los procesos actuales.

## Solución paso a paso

### Paso 1: Reiniciar
Reinicia el equipo. Si el problema persiste, continúa.

### Paso 2: Revisar recursos
- Windows: Abrir **Administrador de tareas** (Ctrl + Shift + Esc).
- Ver pestaña **Procesos** y ordenar por CPU/Memoria.
- Cerrar programas que no se usan.

### Paso 3: Limpiar inicio
- En Administrador de tareas, pestaña **Aplicaciones de inicio**.
- Deshabilitar programas que no necesites al iniciar.

### Paso 4: Liberar espacio
- Eliminar archivos temporales.
- Vaciar papelera de reciclaje.
- Mover documentos grandes a otra unidad.

### Paso 5: Análisis de malware
- Ejecutar Windows Defender o antivirus corporativo.
- Realizar escaneo completo.

### Paso 6: Actualizar sistema
- Windows Update o distribuciones Linux actualizadas.
- Actualizar controladores de disco, chipset y gráficos.

## Cuándo escalar
- Si el equipo tiene menos de 4 GB de RAM.
- Si el disco es HDD y no SSD.
- Si hay errores de disco (revisar con chkdsk o S.M.A.R.T.).

Genera un ticket si necesitas soporte de nivel 2.
      `,
      categoryId: createdCategories['computadores'],
      difficulty: 'BASICO',
      estimatedMinutes: 5,
    },
    {
      title: 'No tengo internet en mi equipo',
      slug: 'sin-internet-equipo',
      excerpt: 'Diagnóstico de conectividad para equipos cableados e inalámbricos.',
      content: `
# No tengo internet en mi equipo

## Síntomas comunes
- Icono de red con "X" o "Sin acceso a Internet".
- No carga ninguna página web.
- Otros equipos sí tienen internet.

## Solución rápida

### 1. Verificar conexión física
- Cable de red bien conectado en equipo y switch/roseta.
- Luces del switch encendidas (Link/Actividad).

### 2. Renovar IP
\`\`\`bash
ipconfig /release
ipconfig /renew
ipconfig /flushdns
\`\`\`

### 3. Probar conectividad
\`\`\`bash
ping 8.8.8.8
ping www.google.com
\`\`\`

- Si el primer ping falla: problema de red local.
- Si el segundo falla pero el primero no: problema DNS.

### 4. Solución DNS
- Cambiar DNS a 8.8.8.8 (Google) o 1.1.1.1 (Cloudflare).
- Verificar configuración en el servidor DHCP.

### 5. Wi-Fi (si aplica)
- Olvidar red y reconectar.
- Verificar contraseña correcta.
- Acercarse al punto de acceso.

## Cuándo escalar
- Si varios equipos no tienen internet (switch/caída de ISP).
- Si solo un equipo presenta el problema (tarjeta de red o drivers).
      `,
      categoryId: createdCategories['redes'],
      difficulty: 'BASICO',
      estimatedMinutes: 3,
    },
    {
      title: 'La impresora no imprime o aparece offline',
      slug: 'impresora-no-imprime',
      excerpt: 'Pasos para resolver impresión atascada, offline o con errores de spooler.',
      content: `
# La impresora no imprime o aparece offline

## Síntomas
- "Impresora offline" en Windows.
- Trabajos atascados en cola de impresión.
- Imprime páginas en blanco o con rayas.

## Solución

### 1. Verificar estado físico
- Papel cargado correctamente.
- Tóner/tinta disponible.
- Sin atascos de papel.
- Cable USB o cable de red conectado.
- Impresora encendida (no en modo reposo).

### 2. Cola de impresión (Windows)
\`\`\`
services.msc → Print Spooler → Reiniciar servicio
\`\`\`

### 3. Establecer como predeterminada
- Panel de control → Dispositivos e impresoras.
- Click derecho → "Establecer como impresora predeterminada".

### 4. Red (impresora de red)
- Asignar IP estática (fuera del rango DHCP).
- Verificar que esté en la misma subred.
- Probar acceso vía navegador a la IP de la impresora.

### 5. Limpiar cabezales (inyección)
- Software de la marca (HP Smart, Epson, Canon).
- Limpieza manual si hay atasco de tinta.

## Cuándo escalar
- Fuser dañado (ruidos, hojas arrugadas, toner no fija).
- Error de placa lógica o USB dañado.
- Requiere reemplazo de componente.
      `,
      categoryId: createdCategories['impresoras'],
      difficulty: 'BASICO',
      estimatedMinutes: 5,
    },
    {
      title: 'Equipo biomédico no enciende o presenta alarma',
      slug: 'biomedico-no-enciende',
      excerpt: 'Procedimiento inicial ante fallas de energía o alarmas en equipos médicos.',
      content: `
# Equipo biomédico no enciende o presenta alarma

## Advertencia
- **Nunca** abras equipos biomédicos sin personal calificado.
- Verifica la garantía y procedimientos del fabricante.
- Si el equipo está en uso clínico activo, notifica al responsable inmediatamente.

## Pasos iniciales

### 1. Verificar energía
- Cable de alimentación conectado.
- Tomacorriente con voltaje adecuado (usa un multímetro si es necesario).
- Si tiene UPS/No-break, verifica indicadores LED.

### 2. Reinicio controlado
- Apagar equipo desde el botón principal.
- Desconectar de la red eléctrica por 30 segundos.
- Reconectar y encender.

### 3. Revisar alarmas visuales
- Consultar el manual del equipo.
- Identificar código de error en pantalla.
- Documentar código exacto para el técnico.

### 4. Calibración
Algunos equipos requieren calibración posterior a un corte de energía:
- Monitores de signos vitales.
- Bombas de infusión.
- Ventiladores.

## Cuándo escalar
- Si el equipo es crítico para pacientes.
- Si hay riesgo de seguridad eléctrica.
- Si se requiere calibración oficial.
- Genera un ticket de mantenimiento **correctivo** de inmediato.
      `,
      categoryId: createdCategories['biomedico'],
      difficulty: 'INTERMEDIO',
      estimatedMinutes: 4,
    },
    {
      title: 'El UPS no enciende o se apaga solo',
      slug: 'ups-no-enciende',
      excerpt: 'Diagnóstico de UPS: batería, sobrecarga y ventilación.',
      content: `
# El UPS no enciende o se apaga solo

## Síntomas
- LED de encendido parpadeando.
- Se apaga al conectar equipo.
- Alarma continua audible.
- No carga la batería.

## Solución

### 1. Verificar conexión
- Conexión directa a toma de pared.
- No usar extensiones o regletas dañadas.

### 2. Cargar batería
- Si no se usa frecuentemente, cargar por 6-12 horas.
- Si la batería tiene más de 3 años, probablemente requiere reemplazo.

### 3. Verificar carga conectada
- Desconectar equipos no esenciales.
- Verificar que no exceda la capacidad del UPS.

### 4. Ventilación
- Verificar que las rejillas de ventilación no estén obstruidas.
- Limpiar filtros si es accesible.

### 5. Reinicio
- Algunos UPS tienen botón de reset físico.
- Desconectar todo y presionar reset.

## Cuándo reemplazar
- La batería no mantiene carga por más de 10 minutos.
- Alarma de "Overload" constante.
- Capacidad reducida drásticamente.
- Costo de reparación mayor al 70% del valor de reemplazo.
      `,
      categoryId: createdCategories['energia'],
      difficulty: 'BASICO',
      estimatedMinutes: 4,
    },
    {
      title: 'Olvidé mi contraseña / Cuenta bloqueada',
      slug: 'cuenta-bloqueada-contrasena',
      excerpt: 'Pasos para recuperar acceso a cuentas corporativas.',
      content: `
# Olvidé mi contraseña / Cuenta bloqueada

## Autoservicio

### Contraseña
- Usar el portal de autoservicio de contraseñas.
- Verificar correo electrónico alterno registrado.
- Responder preguntas de seguridad.

### Cuenta bloqueada
- Esperar 15-30 minutos (bloqueo temporal).
- Contactar al help desk para desbloqueo inmediato.

## Si no funciona
- Contactar a soporte Tier 1.
- Verificar identidad (cédula, número de empleado).
- Proporcionar correo alterno para restablecimiento.
- Nunca compartas tu contraseña por chat o correo.
      `,
      categoryId: createdCategories['soporte-general'],
      difficulty: 'BASICO',
      estimatedMinutes: 2,
    },
    {
      title: 'No puedo imprimir en red compartida',
      slug: 'imprimir-red-compartida',
      excerpt: 'Resolver cuando un equipo no ve la impresora de red o compartida.',
      content: `
# No puedo imprimir en red compartida

## Causas
- Firewall local bloqueando puerto 9100 o compartición.
- Impresora en modo "offline".
- Controladores no instalados.
- Cambio de IP de la impresora.

## Solución

### 1. Verificar conexión
- Ping a la IP de la impresora desde el equipo.
- Si no responde, verificar switch/cable.

### 2. Compartir en Windows
- Panel de control → Dispositivos e impresoras.
- Click derecho en impresora → Propiedades de impresora.
- Compartir → Marcar "Compartir esta impresora".

### 3. Firewall
- Permitir "Impresión y uso compartido" en firewall.
- Solo para red privada/doméstica.

### 4. Controladores
- Descargar driver oficial del fabricante.
- Instalar como impresora de red TCP/IP.

## Cuándo escalar
- Si la impresora está en otra subred.
- Si hay múltiples usuarios afectados (revisar switch/poetter).
      `,
      categoryId: createdCategories['impresoras'],
      difficulty: 'INTERMEDIO',
      estimatedMinutes: 5,
    },
    {
      title: 'Equipo se apaga solo o se reinicia inesperadamente',
      slug: 'equipo-se-apaga-solo',
      excerpt: 'Diagnóstico de fallas de energía, temperatura y hardware.',
      content: `
# Equipo se apaga solo o se reinicia inesperadamente

## Posibles causas
1. Sobrecalentamiento (polvo en ventiladores).
2. Fuente de poder dañada.
3. Memoria RAM con fallos.
4. Drivers conflictivos después de actualización.

## Solución

### 1. Verificar temperaturas
- Instalar **HWMonitor** o similar.
- CPU debe estar por debajo de 80°C en carga.
- Limpiar polvo de ventiladores y disipadores.

### 2. Revisar seguridad
- Desconectar USB adicionales.
- Probar con fuente de poder auxiliar si está disponible.
- Revisar eventos de sistema (Visor de eventos de Windows).

### 3. Diagnóstico de memoria
- Windows: Ejecutar **mdsched.exe**.
- Linux: \`memtester\` o \`memtest86+\`.

## Cuándo escalar
- Si el equipo es portátil y la batería se infla.
- Si hay olor a quemado.
- Si se apaga incluso sin carga (probablemente fuente).
      `,
      categoryId: createdCategories['computadores'],
      difficulty: 'INTERMEDIO',
      estimatedMinutes: 6,
    },
    {
      title: 'Pantalla azul (BSOD) o pantalla negra',
      slug: 'pantalla-azul-bsod',
      excerpt: 'Interpretar códigos de detención y recuperar el sistema.',
      content: `
# Pantalla azul (BSOD) o pantalla negra

## BSOD — Pasos inmediatos

### 1. Anotar código de error
- Ejemplo: \`CRITICAL_PROCESS_DIED\`, \`IRQL_NOT_LESS_OR_EQUAL\`.
- Anotar archivo mencionado (ej: \`ntoskrnl.exe\`).

### 2. Modo seguro
- Reiniciar presionando F8 o Shift + Reiniciar.
- Seleccionar "Modo seguro".
- Si arranca, probablemente es un driver o software nuevo.

### 3. Revisar actualizaciones
- Desinstalar actualizaciones recientes de Windows.
- Restaurar sistema a un punto anterior.

### 4. Pantalla negra (sin BSOD)
- Verificar conexión del cable de video (HDMI/DP).
- Probar con otro monitor/cable.
- Revisar que la tarjeta gráfica esté bien conectada.
- Limpiar contactos de RAM y GPU.

## Cuándo escalar
- Si no arranca ni en modo seguro.
- Si el disco duro presenta errores de lectura.
- Si hay daño físico visible en la motherboard.
      `,
      categoryId: createdCategories['computadores'],
      difficulty: 'INTERMEDIO',
      estimatedMinutes: 5,
    },
    {
      title: 'Configurar correo en Outlook o cliente de correo',
      slug: 'configurar-correo-outlook',
      excerpt: 'Configuración IMAP/SMTP para clientes de correo corporativo.',
      content: `
# Configurar correo en Outlook o cliente de correo

## Información necesaria
- **Servidor IMAP:** \`correo.empresa.com\` o \`outlook.office365.com\`
- **Servidor SMTP:** \`smtp.empresa.com\`
- **Puertos comunes:**
  - IMAP: 993 (SSL) / 143 (sin SSL)
  - SMTP: 587 (TLS) / 465 (SSL)

## Outlook
1. Archivo → Agregar cuenta.
2. Correo electrónico y contraseña.
3. Configuración manual si es necesario.

## Thunderbird
1. Archivo → Nuevo → Correo existente.
2. Ingresar nombre, correo y contraseña.
3. Verificar puertos y seguridad SSL/TLS.

## Problemas comunes
- Error 0x8004010F: Perfil de Outlook corrupto → crear nuevo perfil.
- No envía correos: verificar puerto SMTP y autenticación.
- Timeout: verificar firewall y VPN.

## Cuándo escalar
- Si el servidor corporativo está caído (verificar en webmail).
- Si se requiere configuración de ActiveSync.
      `,
      categoryId: createdCategories['soporte-general'],
      difficulty: 'BASICO',
      estimatedMinutes: 3,
    },
    {
      title: 'Configurar VPN para acceso remoto',
      slug: 'configurar-vpn',
      excerpt: 'Conectar a la red corporativa desde fuera de la oficina.',
      content: `
# Configurar VPN para acceso remoto

## Requisitos
- Credenciales de Active Directory.
- Cliente VPN instalado (Cisco AnyConnect, FortiClient, OpenVPN).

## Pasos generales
1. Instalar cliente VPN corporativo.
2. Importar perfil de conexión (si aplica).
3. Ingresar usuario y contraseña.
4. Conectar y verificar acceso a recursos internos.

## Solución de problemas
- Si no conecta: verificar si estás en red restringida (hotel, café).
- Si conecta pero no accede a recursos: revisar rutas (split tunneling).
- Si la conexión es lenta: probar sin VPN para descartar ISP.

## Importante
- No uses VPN para acceder a sitios prohibidos.
- Cierra la VPN cuando termines la sesión remota.
      `,
      categoryId: createdCategories['redes'],
      difficulty: 'INTERMEDIO',
      estimatedMinutes: 4,
    },
    {
      title: 'Nivel 1 — Mi equipo no enciende',
      slug: 'nivel1-equipo-no-enciende',
      excerpt: 'Pasos básicos antes de escalar al nivel 2.',
      content: `
# Nivel 1 — Mi equipo no enciende

## Checklist rápido (antes de llamar soporte)

### 1. Verificar energía
- ¿El cable de alimentación está conectado firmemente?
- ¿El tomacorriente funciona? (probar con otro aparato)
- Si es laptop: ¿la batería tiene carga? Conectar cargador 15 min.

### 2. Monitor
- ¿El monitor está encendido? (LED de energía)
- ¿Está en la entrada correcta? (HDMI, DisplayPort, VGA)
- Probar con otro cable o puerto.

### 3. Reinicio forzado
- **Desktop:** Mantener botón de encendido 10 seg → soltar → esperar 30 seg → encender
- **Laptop:** Mantener botón 10 seg → quitar batería (si es posible) → reconectar → encender

### 4. Periféricos
- Desconectar todos los USB excepto teclado y mouse
- Quitar dock, USB hub, etc.

## Si no funciona → Escalar a Nivel 2
- Crear ticket indicando: equipo, modelo, número de serie, LED visible
      `,
      categoryId: createdCategories['soporte-general'],
      difficulty: 'BASICO',
      estimatedMinutes: 3,
    },
    {
      title: 'Nivel 1 — No puedo enviar/recibir correos',
      slug: 'nivel1-correo-falla',
      excerpt: 'Diagnóstico rápido de problemas de correo electrónico.',
      content: `
# Nivel 1 — No puedo enviar/recibir correos

## Checklist rápido

### 1. Verificar internet
- ¿Navegas normalmente en el navegador?
- Si no → resolver primero el problema de red

### 2. Outlook no responde
- Cerrar Outlook completamente (verificar en Administrador de tareas)
- Reabrir Outlook
- Si pide contraseña → reingresar credenciales de dominio

### 3. No envía correos
- Verificar tamaño del archivo adjunto (máx 25 MB en la mayoría)
- Intentar sin adjuntos
- Guardar borrador y reenviar

### 4. No recibe correos
- Verificar carpeta de correo no deseado
- Verificar reglas de Outlook (podrían mover correos)
- Abrir Outlook Web para verificar si el servidor recibe

### 5. Outlook Web como alternativa
- Abrir navegador → ingresar URL del webmail
- Si funciona en web → problema con cliente Outlook local

## Si no funciona → Escalar a Nivel 2
- Crear ticket con: usuario, fecha/hora del último correo recibido, error exacto
      `,
      categoryId: createdCategories['soporte-general'],
      difficulty: 'BASICO',
      estimatedMinutes: 3,
    },
    {
      title: 'Nivel 1 — Necesito instalar un programa',
      slug: 'nivel1-instalar-programa',
      excerpt: 'Procedimiento para solicitar instalación de software.',
      content: `
# Nivel 1 — Necesito instalar un programa

## Antes de solicitar

### 1. Verificar si ya está disponible
- Revisar el menú Inicio → buscar el programa
- Verificar en Panel de control → Programas

### 2. Catálogo aprobado
- Consultar con tu supervisor si el software está en el catálogo
- Software no aprobado requiere validación de seguridad

### 3. Autogestión
- Algunas empresas tienen un portal de autoservicio
- Verificar si el software está disponible en ese portal

## Si no está disponible
1. Crear ticket con:
   - Nombre del software y versión necesaria
   - Justificación del uso laboral
   - Si requiere licencia: indicar si ya se compra o se necesita

## Importante
- **No instalar software pirata** o sin licencia
- **No instalar software de fuente no confiable**
- Ciertos software requieren aprobación de TI y Seguridad

## Escalar a Nivel 2/3
- Si requiere configuración especial
- Si necesita acceso a servidor o dominio
      `,
      categoryId: createdCategories['software'],
      difficulty: 'BASICO',
      estimatedMinutes: 2,
    },
    {
      title: 'Nivel 1 — Equipo muy lento después de actualización',
      slug: 'nivel1-lento-actualizacion',
      excerpt: 'Soluciones cuando el equipo se pone lento tras actualizar Windows.',
      content: `
# Nivel 1 — Equipo muy lento después de actualización

## Soluciones rápidas

### 1. Esperar la finalización
- Windows puede estar instalando actualizaciones en segundo plano
- Dejar el equipo encendido 30-60 minutos sin usar
- No apagar durante este proceso

### 2. Verificar en Administrador de Tareas
- Ctrl+Shift+Esc → pestaña Procesos
- Buscar "Windows Update" o "TiWorker" usando CPU alta
- Si es así → esperar a que termine

### 3. Liberar espacio en disco
- Windows Update necesita espacio temporal
- Verificar que disco C tenga al menos 10 GB libres
- Limpiar archivos temporales: <code>cleanmgr</code>

### 4. Reiniciar
- Si después de 1 hora sigue lento → reiniciar
- Puede haber actualizaciones pendientes de reinicio

## Si no mejora → Escalar a Nivel 2
- Crear ticket indicando:
  - Versión de Windows instalada
  - Espacio libre en disco C
  - Tiempo desde la actualización
      `,
      categoryId: createdCategories['computadores'],
      difficulty: 'BASICO',
      estimatedMinutes: 3,
    },
    {
      title: 'Nivel 1 — No puedo conectarme al dominio / WiFi',
      slug: 'nivel1-conexion-dominio-wifi',
      excerpt: 'Pasos para resolver problemas de autenticación de dominio y WiFi.',
      content: `
# Nivel 1 — No puedo conectarme al dominio / WiFi

## WiFi no conecta

### 1. Olvidar y reconocer
- Configuración → WiFi → Red conocida → Olvidar
- Reconectar ingresando la contraseña

### 2. Verificar other
- ¿Otros equipos se conectan a la misma red?
- Si no → el problema es el router/Access Point

### 3. Olvidar y reconectar
- Configuración → Red → WiFi → Olvidar red
- Reiniciar adaptador de red
- Conectar nuevamente

## Dominio no carga

### 1. Reconectar a la red
- Si WiFi se desconecta frecuentemente → cable de red

### 2. Verificar credenciales
- ¿La contraseña de dominio es correcta?
- ¿La cuenta está bloqueada? (esperar 15 min o llamar TI)

### 3. Equipo fuera del dominio
- Si el equipo fue reformateado → necesita re-unirse al dominio
- Contactar Nivel 2

## Si no funciona → Escalar a Nivel 2
- Ticket con: usuario, máquina, red, error exacto
      `,
      categoryId: createdCategories['redes'],
      difficulty: 'BASICO',
      estimatedMinutes: 3,
    },
    {
      title: 'Nivel 2 — Error de driver o dispositivo no reconocido',
      slug: 'nivel2-driver-dispositivo',
      excerpt: 'Soluciones intermedias para dispositivos que no funcionan correctamente.',
      content: `
# Nivel 2 — Error de driver o dispositivo no reconocido

## Diagnóstico

### 1. Administrador de dispositivos
- Win + X → Administrador de dispositivos
- Buscar dispositivo con ícono amarillo (⚠️) o rojo (❌)
- Notar el mensaje de error exacto

### 2. Códigos de error comunes
- **Código 28:** Driver no instalado
- **Código 43:** Dispositivo reportó un problema
- **Código 10:** No se puede iniciar el dispositivo
- **Código 52:** Firma digital no verificada

## Soluciones

### Driver no instalado
1. Descargar driver oficial del fabricante
2. Ejecutar como Administrador
3. Reiniciar después de la instalación

### Dispositivo no reconocido
1. Desconectar y reconectar (USB)
2. Probar otro puerto
3. Probar en otro equipo para descartar falla del hardware

### Actualización de Windows bloquea driver
1. Configuración → Actualización → Opciones avanzadas
2. "Omitir actualizaciones de calidad"
3. Restaurar driver anterior si es necesario

## Cuándo escalar a Nivel 3
- Si el dispositivo requiere firmware especializado
- Si es equipo biomédico o crítico
- Si el hardware está dañado físicamente
      `,
      categoryId: createdCategories['computadores'],
      difficulty: 'INTERMEDIO',
      estimatedMinutes: 6,
    },
    {
      title: 'Nivel 2 — Configurar impresora de red nueva',
      slug: 'nivel2-impresora-red-nueva',
      excerpt: 'Guía para técnicos: agregar una impresora de red al dominio.',
      content: `
# Nivel 2 — Configurar impresora de red nueva

## Requisitos
- IP estática asignada para la impresora
- Acceso a la consola de la impresora (panel frontal)
- Driver oficial del fabricante

## Pasos

### 1. Configurar IP en la impresora
- Menú de la impresora → Red → TCP/IP
- Asignar IP fuera del rango DHCP (ej: 192.168.1.200)
- Subnet mask: 255.255.255.0
- Gateway: IP del router

### 2. Verificar conectividad
\`\`\`
ping [IP de la impresora]
\`\`\`

### 3. Agregar en Windows
1. Panel de control → Dispositivos e impresoras
2. "Agregar impresora"
3. "Agregar impresora con configuración manual"
4. "Usar una impresora existente" → TCP/IP
5. Ingresar IP de la impresora
6. Seleccionar driver correspondiente

### 4. Configurar cola
- Propiedades de impresora → Colas → Configurar
- Habilitar "Spool print documents"
- "Start printing after last page is spooled"

### 5. Compartir
- Propiedades → Compartir → Compartir esta impresora
- Nombre de compartición descriptivo

## Pruebas
- Imprimir página de prueba desde propiedades
- Verificar desde otro equipo
- Documentar IP y ubicación en inventario
      `,
      categoryId: createdCategories['impresoras'],
      difficulty: 'INTERMEDIO',
      estimatedMinutes: 8,
    },
    {
      title: 'Nivel 3 — Recuperación de datos y disco dañado',
      slug: 'nivel3-disco-danado',
      excerpt: 'Procedimientos avanzados para recuperación de datos y discos.',
      content: `
# Nivel 3 — Recuperación de datos y disco dañado

## ⚠️ IMPORTANTE
- **No intentar escribir** en el disco dañado
- **No ejecutar CHKDSK /F** si hay datos críticos sin respaldo
- **Disconnectar inmediatamente** si se escuchan ruidos anormales (clics, zumbidos)

## Diagnóstico

### 1. SMART del disco
\`\`\`
wmic diskdrive get status
\`\`\`
O usar CrystalDiskInfo para lectura SMART completa

### 2. Síntomas de falla
- Archivos que desaparecen o están corruptos
- Tiempos de acceso excesivos
- Errores al copiar archivos
- Pantalla azul con error CRITICAL_PROCESS_DIED

## Nivel 3 — Procedimiento

### 1. Crear imagen del disco
- Usar Clonezilla o dd para crear imagen bit a bit
- Trabajar SOLO con la imagen, nunca con el disco original
- Verificar integridad de la imagen

### 2. Recuperación con herramientas
- **TestDisk:** Recuperar particiones
- **PhotoRec:** Recuperar archivos eliminados
- **R-Studio:** Recuperación profesional

### 3. Documentación
- Documentar: modelo, capacidad, tipo de falla, datos recuperados
- Registrar en hoja de vida del activo
- Notificar al usuario sobre estado de los datos

## Reemplazo
- Formatear disco nuevo
- Instalar SO desde imagen corporativa
- Restaurar datos desde backup o imagen
- Verificar funcionamiento por 48 horas

## Prevenir futuras fallas
- Verificar SMART mensualmente
- Mantener backup actualizado
- Reemplazar discos mayores a 5 años
      `,
      categoryId: createdCategories['computadores'],
      difficulty: 'AVANZADO',
      estimatedMinutes: 15,
    },
    {
      title: 'Nivel 3 — Configuración de servidor de impresión',
      slug: 'nivel3-servidor-impresion',
      excerpt: 'Instalación y configuración de role de impresión en servidor Windows.',
      content: `
# Nivel 3 — Configuración de servidor de impresión

## Requisitos
- Servidor Windows con role "Servicios de impresión"
- IPs estáticas para todas las impresoras
- Driver de cada modelo de impresora (x64 y x86)

## Instalación del role

### 1. Server Manager
- Agregar roles → Servicios de impresión
- Incluir: Server for Print Queues, LPD Service

### 2. Compartir impresoras
- Todas las impresoras conectadas al servidor se comparten automáticamente
- Verificar permisos: Users = Print, Administrators = Full

### 3. Deploy con GPO
\`\`\`powershell
# Script de deploy
rundll32 printui.dll,PrintUIEntry /in /n "Nombre del Servidor\\Nombre Impresora"
\`\`\`

### 4. Driver Management
- Mantener repositorio de drivers actualizado
- Usar "Driver Isolation" para estabilidad
- Probar driver antes de distribuir

## Monitoreo
- Usar Print Management Console
- Alertas por cola de impresión atascada
- Estadísticas de uso por impresora/usuario

## Backup y DR
- Exportar configuración de impresoras periódicamente
- Documentar mapping impresora-IP-usuarios
- Tener plan de failover si el servidor cae
      `,
      categoryId: createdCategories['impresoras'],
      difficulty: 'AVANZADO',
      estimatedMinutes: 12,
    },
  ];

  for (const article of articles) {
    await prisma.knowledgeArticle.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        difficulty: article.difficulty,
        estimatedMinutes: article.estimatedMinutes,
      },
      create: article,
    });
    console.log(`  ✓ Artículo: ${article.title}`);
  }

  console.log('\n✅ Knowledge Base seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
