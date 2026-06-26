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
