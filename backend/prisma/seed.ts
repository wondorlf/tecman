import { PrismaClient, AssetStatus, MaintenanceType, FieldType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create Roles
    const adminRole = await prisma.role.upsert({
        where: { name: 'Administrador' },
        update: {},
        create: {
            name: 'Administrador',
            description: 'Acceso completo al sistema',
            permissions: JSON.stringify({
                assets: { create: true, read: true, update: true, delete: true },
                maintenance: { create: true, read: true, update: true, delete: true },
                users: { create: true, read: true, update: true, delete: true },
                checklists: { create: true, read: true, update: true, delete: true },
                documents: { create: true, read: true, update: true, delete: true },
                alerts: { create: true, read: true, update: true, delete: true },
                reports: { read: true, export: true },
                admin: true,
            }),
        },
    });

    const gestorRole = await prisma.role.upsert({
        where: { name: 'Gestor' },
        update: {},
        create: {
            name: 'Gestor',
            description: 'Gestión de inventario y mantenimiento',
            permissions: JSON.stringify({
                assets: { create: true, read: true, update: true, delete: false },
                maintenance: { create: true, read: true, update: true, delete: false },
                users: { read: true },
                checklists: { create: true, read: true, update: true, delete: false },
                documents: { create: true, read: true, update: true, delete: false },
                alerts: { create: true, read: true, update: true },
                reports: { read: true, export: true },
            }),
        },
    });

    // Create Técnico role
    const tecnicoRole = await prisma.role.upsert({
        where: { name: 'Técnico' },
        update: {},
        create: {
            name: 'Técnico',
            description: 'Ejecuta mantenimientos y resuelve tickets asignados',
            permissions: JSON.stringify({
                assets: { read: true, update: true },
                maintenance: { create: true, read: true, update: true, delete: false },
                tickets: { create: true, read: true, update: true },
                checklists: { read: true, update: true },
                documents: { read: true, create: true, update: true },
                alerts: { read: true, update: true },
            }),
        },
    });

    // Create Portal Público role (mínimos permisos para crear tickets vía portal público)
    const portalRole = await prisma.role.upsert({
        where: { name: 'Portal Público' },
        update: {},
        create: {
            name: 'Portal Público',
            description: 'Acceso mínimo para usuarios del portal público de soporte',
            permissions: JSON.stringify({
                assets: { read: true },
                tickets: { create: true, read: true, update: false },
                knowledge: { read: true },
            }),
        },
    });

    console.log('✅ Roles created (Administrador, Gestor, Técnico, Portal Público)');

    // Create Admin User
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@tecman.local' },
        update: {},
        create: {
            email: 'admin@tecman.local',
            password: hashedAdminPassword,
            name: 'Administrador TecMan',
            roleId: adminRole.id,
        },
    });

    const hashedEganPassword = await bcrypt.hash('egan', 10);
    await prisma.user.upsert({
        where: { email: 'egan@tecman.com' },
        update: {},
        create: {
            email: 'egan@tecman.com',
            password: hashedEganPassword,
            name: 'Superadministrador Egan',
            roleId: adminRole.id,
        },
    });

    const hashedJorgePassword = await bcrypt.hash('1003804743', 10);
    await prisma.user.upsert({
        where: { email: 'jorgeluismontiel@outlook.com' },
        update: {},
        create: {
            email: 'jorgeluismontiel@outlook.com',
            username: 'jorge.montiel',
            password: hashedJorgePassword,
            name: 'Jorge Montiel',
            roleId: adminRole.id,
        },
    });

    console.log('✅ Admin and Egan users created');

    // ── LOCATIONS ─────────────────────────────────────────────────────────
    const locations = [
        { name: 'Oficina Principal', code: 'OP-01', address: 'Sede corporativa principal' },
        { name: 'Bodega Central', code: 'BC-01', address: 'Almacenamiento de equipos y repuestos' },
        { name: 'Data Center', code: 'DC-01', address: 'Sala de servidores y redes' },
        { name: 'Planta de Produccion', code: 'PP-01', address: 'Area de manufacturing' },
        { name: 'Sala de Conferencias', code: 'SC-01', address: 'Espacio de reuniones ejecutivas' },
    ];

    for (const loc of locations) {
        const existing = await prisma.location.findFirst({ where: { name: loc.name } });
        if (!existing) {
            await prisma.location.create({ data: loc });
        }
    }
    console.log('✅ Locations created');

    // ── SUPPLIERS ─────────────────────────────────────────────────────────
    const suppliers = [
        { name: 'Dell Colombia', contact: 'Soporte Dell', email: 'soporte@dell.com.co', phone: '018000-3355' },
        { name: 'HP Colombia', contact: 'HP Enterprise', email: 'empresarial@hp.com.co', phone: '018000-4700' },
        { name: 'Lenovo Colombia', contact: 'Lenovo TI', email: 'soporte@lenovo.com.co', phone: '018000-5366' },
        { name: 'Epson Andina', contact: 'Epson Soporte', email: 'soporte@epson.com.co', phone: '018000-3776' },
    ];

    for (const sup of suppliers) {
        const existing = await prisma.supplier.findFirst({ where: { name: sup.name } });
        if (!existing) {
            await prisma.supplier.create({ data: sup });
        }
    }
    console.log('✅ Suppliers created');

    // ── TAGS ──────────────────────────────────────────────────────────────
    const tags = [
        { name: 'Urgente', color: '#EF4444' },
        { name: 'Fuera de Garantia', color: '#F59E0B' },
        { name: 'Prioritario', color: '#3B82F6' },
        { name: 'Requiere Repuesto', color: '#8B5CF6' },
        { name: 'En Revision', color: '#6366F1' },
    ];

    for (const tag of tags) {
        await prisma.tag.upsert({
            where: { name: tag.name },
            update: {},
            create: tag,
        });
    }
    console.log('✅ Tags created');

    // ── SLAs ──────────────────────────────────────────────────────────────
    const slas = [
        { name: 'SLA Basico', description: 'Respuesta 8h, resolucion 24h', responseHours: 8, resolutionHours: 24 },
        { name: 'SLA Estandar', description: 'Respuesta 4h, resolucion 8h', responseHours: 4, resolutionHours: 8 },
        { name: 'SLA Critico', description: 'Respuesta 1h, resolucion 4h', responseHours: 1, resolutionHours: 4 },
    ];

    for (const sla of slas) {
        await prisma.sla.upsert({
            where: { name: sla.name },
            update: {},
            create: sla,
        });
    }
    console.log('✅ SLAs created');

    // ── SERVICE CATALOG ───────────────────────────────────────────────────
    const services = [
        { name: 'Soporte TI General', description: 'Atencion de incidencias TI basicas', category: 'SOPORTE', type: 'INCIDENT' },
        { name: 'Instalacion de Software', description: 'Instalacion y configuracion de aplicaciones', category: 'SOFTWARE', type: 'REQUEST' },
        { name: 'Mantenimiento Preventivo', description: 'Revision programada de equipos', category: 'MANTENIMIENTO', type: 'REQUEST' },
        { name: 'Reparacion de Hardware', description: 'Diagnostico y reparacion de componentes', category: 'HARDWARE', type: 'INCIDENT' },
        { name: 'Configuracion de Red', description: 'Configuracion de conexiones de red', category: 'REDES', type: 'REQUEST' },
    ];

    for (const svc of services) {
        await prisma.serviceCatalog.upsert({
            where: { name: svc.name },
            update: {},
            create: svc,
        });
    }
    console.log('✅ Service Catalog created');

    // ── TENANT ────────────────────────────────────────────────────────────
    const existingTenant = await prisma.tenant.findFirst();
    if (!existingTenant) {
        await prisma.tenant.create({
            data: {
                id: 'default-tenant',
                name: 'EGAN - GAMA',
                primaryColor: '#3B82F6',
                secondaryColor: '#0f172a',
            },
        });
    }
    console.log('✅ Tenant created');

    // ── CATEGORIES ────────────────────────────────────────────────────────
    const categories = [
        {
            name: 'Tecnológico',
            description: 'Equipos de cómputo, redes y accesorios tecnológicos',
            icon: '💻',
            color: '#3B82F6',
            subcategories: [
                { name: 'Computadores de Escritorio', description: 'PCs de escritorio y workstations' },
                { name: 'Portátiles / Laptops', description: 'Computadores portátiles y notebooks' },
                { name: 'Servidores', description: 'Servidores físicos y blades' },
                { name: 'Monitores', description: 'Pantallas y monitores' },
                { name: 'Periféricos', description: 'Teclados, mouse, webcams, audífonos' },
                { name: 'Impresoras', description: 'Impresoras láser, tinta y multifuncionales' },
                { name: 'Tablets', description: 'Tabletas digitales' },
                { name: 'Celulares', description: 'Teléfonos inteligentes' },
                { name: 'Switches / Routers', description: 'Equipos de red activa' },
                { name: 'Cableado Estructurado', description: 'Patch panels, cables, conectores' },
                { name: 'UPS / No-Break', description: 'Sistemas de alimentación ininterrumpida' },
                { name: 'Accesorios TI', description: 'Docking stations, adaptadores, hubs' },
                { name: 'Almacenamiento', description: 'Discos duros, NAS, SSDs externos' },
            ],
        },
        {
            name: 'Biomédico',
            description: 'Equipos médicos, odontológicos y de laboratorio clínico',
            icon: '🏥',
            color: '#EF4444',
            subcategories: [
                { name: 'Equipos de Diagnóstico', description: 'Monitor de signos vitales, ECG, espirómetros' },
                { name: 'Equipos de Imagenología', description: 'Rayos X, ecógrafos, tomógrafos' },
                { name: 'Equipos de Terapia', description: 'Ventiladores, bombas de infusión, aspiradores' },
                { name: 'Equipos de Laboratorio', description: 'Centrífugas, microscopios, autoanalizadores' },
                { name: 'Equipos de Odontología', description: 'Sillones, rayos X panorámico, autoclaves' },
                { name: 'Mobiliario Clínico', description: 'Camillas, carros de paro, lámparas cialíticas' },
                { name: 'Equipos de Esterilización', description: 'Autoclaves, lavadoras ultrasónicas' },
                { name: 'Equipos de Rehabilitación', description: 'Electroestimuladores, ultrasonido terapéutico' },
            ],
        },
        {
            name: 'Mobiliario y Enseres',
            description: 'Muebles de oficina, bodega y áreas comunes',
            icon: '🪑',
            color: '#F59E0B',
            subcategories: [
                { name: 'Escritorios', description: 'Escritorios y mesas de trabajo' },
                { name: 'Sillas', description: 'Sillas de oficina, visitantes, sala de juntas' },
                { name: 'Archivadores', description: 'Archivadores metálicos y organizadores' },
                { name: 'Gabinetes', description: 'Gabinetes de almacenamiento general' },
                { name: 'Mesas de Reuniones', description: 'Mesas para salas de juntas y capacitación' },
                { name: 'Lockers / Casilleros', description: 'Casilleros metálicos personales' },
                { name: 'Estanterías', description: 'Estanterías industriales y de bodega' },
                { name: 'Sillones / Sofás', description: 'Sillones de espera y salas de estar' },
            ],
        },
        {
            name: 'Vehículos',
            description: 'Vehículos automotores de la organización',
            icon: '🚗',
            color: '#10B981',
            subcategories: [
                { name: 'Automóviles', description: 'Vehículos de pasajeros' },
                { name: 'Camionetas', description: 'Camionetas 4x4 y pick-ups' },
                { name: 'Motocicletas', description: 'Motos de mensajería y supervisión' },
                { name: 'Montacargas', description: 'Montacargas eléctricos y de combustión' },
                { name: 'Bicicletas', description: 'Bicicletas de uso corporativo' },
            ],
        },
        {
            name: 'Maquinaria y Equipo',
            description: 'Maquinaria industrial, herramientas y equipos especializados',
            icon: '⚙️',
            color: '#6366F1',
            subcategories: [
                { name: 'Maquinaria Industrial', description: 'Tornos, fresadoras, prensas' },
                { name: 'Herramientas Eléctricas', description: 'Taladros, esmeriles, sierras' },
                { name: 'Herramientas Manuales', description: 'Juegos de llaves, destornilladores, alicates' },
                { name: 'Equipos de Medición', description: 'Multímetros, calibradores, termómetros' },
                { name: 'Equipos de Soldadura', description: 'Máquinas de soldar, equipos de corte' },
                { name: 'Equipos de Seguridad Industrial', description: 'Arnés, cascos, detectores de gas' },
            ],
        },
        {
            name: 'Infraestructura',
            description: 'Instalaciones físicas y equipos de planta',
            icon: '🏗️',
            color: '#8B5CF6',
            subcategories: [
                { name: 'Aires Acondicionados', description: 'Minisplit, centrales, precisión' },
                { name: 'Plantas Eléctricas', description: 'Generadores de emergencia' },
                { name: 'Sistemas de CCTV', description: 'Cámaras, DVR/NVR, monitores de vigilancia' },
                { name: 'Control de Acceso', description: 'Lectores de huella, torniquetes, tarjeteros' },
                { name: 'Extintores', description: 'Extintores y sistemas contra incendios' },
                { name: 'Señalización', description: 'Letreros y avisos de seguridad' },
                { name: 'Tableros Eléctricos', description: 'Breakers, contactores, tableros de distribución' },
                { name: 'Sistemas de Bombeo', description: 'Bombas de agua, hidroneumáticos' },
            ],
        },
    ];

    // Upsert each category and its subcategories
    for (const cat of categories) {
        const created = await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: {
                name: cat.name,
                description: cat.description,
                icon: cat.icon,
                color: cat.color,
                subcategories: {
                    create: cat.subcategories.map(sub => ({
                        name: sub.name,
                        description: sub.description,
                    })),
                },
            },
        });
        console.log(`  ✓ ${cat.name} (${cat.subcategories.length} subcategorías)`);
    }

    console.log('✅ Categories and subcategories created');

    // Create Sample Checklist
    const checklist = await prisma.checklist.upsert({
        where: { id: 'checklist-preventivo-pc' },
        update: {},
        create: {
            id: 'checklist-preventivo-pc',
            name: 'Mantenimiento Preventivo - Computador',
            description: 'Lista de verificación para mantenimiento preventivo de computadores',
            maintenanceType: MaintenanceType.PREVENTIVE,
            items: {
                create: [
                    { order: 0, label: 'Limpieza externa del equipo', type: FieldType.CHECKBOX, required: true },
                    { order: 1, label: 'Limpieza interna (ventiladores)', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Verificación de cables', type: FieldType.CHECKBOX, required: true },
                    { order: 3, label: 'Prueba de encendido', type: FieldType.CHECKBOX, required: true },
                    { order: 8, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    // ── CHECKLISTS POR CATEGORÍA ────────────────────────────────────────
    // Tecnológico
    const techPreventivo = await prisma.checklist.upsert({
        where: { id: 'cl-tech-prev' },
        update: {},
        create: {
            id: 'cl-tech-prev', name: 'MP Preventivo - Equipo Tecnológico',
            description: 'Mantenimiento preventivo para computadores, laptops, servidores e impresoras',
            maintenanceType: MaintenanceType.PREVENTIVE,
            items: {
                create: [
                    { order: 0, label: 'Inspección visual externa (daños, suciedad)', type: FieldType.CHECKBOX, required: true },
                    { order: 1, label: 'Limpieza de polvo en ventilaciones y puertos', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Limpieza de pantalla y teclado', type: FieldType.CHECKBOX, required: true },
                    { order: 3, label: 'Verificación de cables y conexiones', type: FieldType.CHECKBOX, required: true },
                    { order: 4, label: 'Actualización de sistema operativo', type: FieldType.CHECKBOX, required: false },
                    { order: 5, label: 'Verificación de antimalware activo', type: FieldType.CHECKBOX, required: true },
                    { order: 6, label: 'Revisión de espacio en disco', type: FieldType.NUMBER, required: false },
                    { order: 7, label: 'Prueba de rendimiento (velocidad, temperatura)', type: FieldType.TEXT, required: false },
                    { order: 8, label: 'Backup de datos críticos', type: FieldType.CHECKBOX, required: true },
                    { order: 9, label: 'Observaciones adicionales', type: FieldType.TEXT, required: false },
                    { order: 10, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    const techCorrectivo = await prisma.checklist.upsert({
        where: { id: 'cl-tech-corr' },
        update: {},
        create: {
            id: 'cl-tech-corr', name: 'MC Correctivo - Equipo Tecnológico',
            description: 'Diagnóstico y reparación de fallas en equipos de cómputo y red',
            maintenanceType: MaintenanceType.CORRECTIVE,
            items: {
                create: [
                    { order: 0, label: 'Descripción del problema reportado', type: FieldType.TEXT, required: true },
                    { order: 1, label: 'Diagnóstico del componente dañado', type: FieldType.TEXT, required: true },
                    { order: 2, label: 'Reemplazo de componente (si aplica)', type: FieldType.CHECKBOX, required: false },
                    { order: 3, label: 'Componente reemplazado (modelo/número)', type: FieldType.TEXT, required: false },
                    { order: 4, label: 'Prueba funcional post-reparación', type: FieldType.CHECKBOX, required: true },
                    { order: 5, label: 'Costo de repuesto', type: FieldType.NUMBER, required: false },
                    { order: 6, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 7, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    const techPredictivo = await prisma.checklist.upsert({
        where: { id: 'cl-tech-pred' },
        update: {},
        create: {
            id: 'cl-tech-pred', name: 'MP Predictivo - Equipo Tecnológico',
            description: 'Análisis predictivo basado en métricas de rendimiento y uso',
            maintenanceType: MaintenanceType.PREDICTIVE,
            items: {
                create: [
                    { order: 0, label: 'Temperatura máxima registrada (°C)', type: FieldType.NUMBER, required: true },
                    { order: 1, label: 'Uso promedio de CPU (%)', type: FieldType.NUMBER, required: true },
                    { order: 2, label: 'Uso promedio de RAM (%)', type: FieldType.NUMBER, required: true },
                    { order: 3, label: 'Espacio en disco restante (%)', type: FieldType.NUMBER, required: true },
                    { order: 4, label: 'Horas de uso del equipo', type: FieldType.NUMBER, required: false },
                    { order: 5, label: 'Ruido anormal en ventiladores', type: FieldType.CHECKBOX, required: true },
                    { order: 6, label: 'Errores en registro de eventos', type: FieldType.CHECKBOX, required: true },
                    { order: 7, label: 'Vida útil estimada restante (meses)', type: FieldType.NUMBER, required: false },
                    { order: 8, label: 'Recomendación de reemplazo', type: FieldType.TEXT, required: false },
                    { order: 9, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    // Biomédico
    const bioPreventivo = await prisma.checklist.upsert({
        where: { id: 'cl-bio-prev' },
        update: {},
        create: {
            id: 'cl-bio-prev', name: 'MP Preventivo - Equipo Biomédico',
            description: 'Mantenimiento preventivo para equipos médicos (ISO 55001, FDA MDR)',
            maintenanceType: MaintenanceType.PREVENTIVE,
            items: {
                create: [
                    { order: 0, label: 'Inspección visual y limpieza externa', type: FieldType.CHECKBOX, required: true },
                    { order: 1, label: 'Calibración de instrumentos de medición', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Prueba de seguridad eléctrica (tierra, fuga)', type: FieldType.CHECKBOX, required: true },
                    { order: 3, label: 'Verificación de alarmas y alertas', type: FieldType.CHECKBOX, required: true },
                    { order: 4, label: 'Revisión de cables y conexiones', type: FieldType.CHECKBOX, required: true },
                    { order: 5, label: 'Prueba funcional completa', type: FieldType.CHECKBOX, required: true },
                    { order: 6, label: 'Revisión de documentación y protocolos', type: FieldType.CHECKBOX, required: false },
                    { order: 7, label: 'Estado de baterías internas', type: FieldType.TEXT, required: false },
                    { order: 8, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 9, label: 'Firma del técnico biomédico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    const bioCorrectivo = await prisma.checklist.upsert({
        where: { id: 'cl-bio-corr' },
        update: {},
        create: {
            id: 'cl-bio-corr', name: 'MC Correctivo - Equipo Biomédico',
            description: 'Reparación de equipos médicos con protocolo de seguridad',
            maintenanceType: MaintenanceType.CORRECTIVE,
            items: {
                create: [
                    { order: 0, label: 'Reporte del incidente / falla', type: FieldType.TEXT, required: true },
                    { order: 1, label: 'Verificar que el equipo esté desenergizado', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Diagnóstico del componente fallido', type: FieldType.TEXT, required: true },
                    { order: 3, label: 'Pieza de repuesto utilizada', type: FieldType.TEXT, required: false },
                    { order: 4, label: 'Prueba post-reparación', type: FieldType.CHECKBOX, required: true },
                    { order: 5, label: 'Calibración post-reparación', type: FieldType.CHECKBOX, required: true },
                    { order: 6, label: 'Reporte FDA MDR (si aplica)', type: FieldType.CHECKBOX, required: false },
                    { order: 7, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 8, label: 'Firma del técnico biomédico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    // Infraestructura
    const infraPreventivo = await prisma.checklist.upsert({
        where: { id: 'cl-infra-prev' },
        update: {},
        create: {
            id: 'cl-infra-prev', name: 'MP Preventivo - Infraestructura',
            description: 'Mantenimiento preventivo para aires acondicionados, plantas eléctricas, CCTV, tableros eléctricos',
            maintenanceType: MaintenanceType.PREVENTIVE,
            items: {
                create: [
                    { order: 0, label: 'Inspección visual general', type: FieldType.CHECKBOX, required: true },
                    { order: 1, label: 'Limpieza de filtros y componentes', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Verificación de niveles de fluidos/aceite', type: FieldType.CHECKBOX, required: false },
                    { order: 3, label: 'Prueba de funcionamiento a carga completa', type: FieldType.CHECKBOX, required: true },
                    { order: 4, label: 'Medición de voltaje y amperaje', type: FieldType.NUMBER, required: false },
                    { order: 5, label: 'Verificación de protecciones eléctricas', type: FieldType.CHECKBOX, required: true },
                    { order: 6, label: 'Revisión de fugas (agua/gas)', type: FieldType.CHECKBOX, required: true },
                    { order: 7, label: 'Estado de bombas y válvulas', type: FieldType.TEXT, required: false },
                    { order: 8, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 9, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    const infraCorrectivo = await prisma.checklist.upsert({
        where: { id: 'cl-infra-corr' },
        update: {},
        create: {
            id: 'cl-infra-corr', name: 'MC Correctivo - Infraestructura',
            description: 'Reparación de equipos de infraestructura y planta',
            maintenanceType: MaintenanceType.CORRECTIVE,
            items: {
                create: [
                    { order: 0, label: 'Descripción de la falla', type: FieldType.TEXT, required: true },
                    { order: 1, label: 'Verificar aislamiento energético', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Diagnóstico del componente', type: FieldType.TEXT, required: true },
                    { order: 3, label: 'Pieza/reemplazo utilizado', type: FieldType.TEXT, required: false },
                    { order: 4, label: 'Prueba de funcionamiento post-reparación', type: FieldType.CHECKBOX, required: true },
                    { order: 5, label: 'Medición post-reparación (voltaje/amperaje)', type: FieldType.NUMBER, required: false },
                    { order: 6, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 7, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    // Vehículos
    const vehPreventivo = await prisma.checklist.upsert({
        where: { id: 'cl-veh-prev' },
        update: {},
        create: {
            id: 'cl-veh-prev', name: 'MP Preventivo - Vehículos',
            description: 'Mantenimiento preventivo para automóviles y camionetas',
            maintenanceType: MaintenanceType.PREVENTIVE,
            items: {
                create: [
                    { order: 0, label: 'Cambio de aceite y filtro', type: FieldType.CHECKBOX, required: true },
                    { order: 1, label: 'Revisión de frenos (pastillas, discos)', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Inspección de neumáticos (desgaste, presión)', type: FieldType.CHECKBOX, required: true },
                    { order: 3, label: 'Revisión de luces y señales', type: FieldType.CHECKBOX, required: true },
                    { order: 4, label: 'Nivel de líquidos (freno, dirección, limpiaparabrisas)', type: FieldType.CHECKBOX, required: true },
                    { order: 5, label: 'Revisión de correa del alternador', type: FieldType.CHECKBOX, required: false },
                    { order: 6, label: 'Filtro de aire y aire acondicionado', type: FieldType.CHECKBOX, required: false },
                    { order: 7, label: 'Prueba de batería', type: FieldType.NUMBER, required: false },
                    { order: 8, label: 'Kilometraje actual', type: FieldType.NUMBER, required: true },
                    { order: 9, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 10, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    const vehCorrectivo = await prisma.checklist.upsert({
        where: { id: 'cl-veh-corr' },
        update: {},
        create: {
            id: 'cl-veh-corr', name: 'MC Correctivo - Vehículos',
            description: 'Reparación correctiva de vehículos',
            maintenanceType: MaintenanceType.CORRECTIVE,
            items: {
                create: [
                    { order: 0, label: 'Descripción de la falla', type: FieldType.TEXT, required: true },
                    { order: 1, label: 'Diagnóstico del componente', type: FieldType.TEXT, required: true },
                    { order: 2, label: 'Pieza de repuesto utilizada', type: FieldType.TEXT, required: false },
                    { order: 3, label: 'Prueba de manejo post-reparación', type: FieldType.CHECKBOX, required: true },
                    { order: 4, label: 'Costo del repuesto', type: FieldType.NUMBER, required: false },
                    { order: 5, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 6, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    // Maquinaria y Equipo
    const maqPreventivo = await prisma.checklist.upsert({
        where: { id: 'cl-maq-prev' },
        update: {},
        create: {
            id: 'cl-maq-prev', name: 'MP Preventivo - Maquinaria',
            description: 'Mantenimiento preventivo para maquinaria industrial y herramientas',
            maintenanceType: MaintenanceType.PREVENTIVE,
            items: {
                create: [
                    { order: 0, label: 'Inspección visual general', type: FieldType.CHECKBOX, required: true },
                    { order: 1, label: 'Limpieza de virutas y residuos', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Lubricación de partes móviles', type: FieldType.CHECKBOX, required: true },
                    { order: 3, label: 'Ajuste de tornillos y fijaciones', type: FieldType.CHECKBOX, required: true },
                    { order: 4, label: 'Verificación de alineación', type: FieldType.CHECKBOX, required: true },
                    { order: 5, label: 'Prueba de funcionamiento sin carga', type: FieldType.CHECKBOX, required: true },
                    { order: 6, label: 'Inspección de protecciones de seguridad', type: FieldType.CHECKBOX, required: true },
                    { order: 7, label: 'Estado de cintas/correas/herramientas', type: FieldType.TEXT, required: false },
                    { order: 8, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 9, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    const maqCorrectivo = await prisma.checklist.upsert({
        where: { id: 'cl-maq-corr' },
        update: {},
        create: {
            id: 'cl-maq-corr', name: 'MC Correctivo - Maquinaria',
            description: 'Reparación de maquinaria industrial',
            maintenanceType: MaintenanceType.CORRECTIVE,
            items: {
                create: [
                    { order: 0, label: 'Descripción de la falla', type: FieldType.TEXT, required: true },
                    { order: 1, label: 'Verificar que la máquina esté desenergizada y bloqueada', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Diagnóstico del componente', type: FieldType.TEXT, required: true },
                    { order: 3, label: 'Herramientas utilizadas', type: FieldType.TEXT, required: false },
                    { order: 4, label: 'Pieza de repuesto', type: FieldType.TEXT, required: false },
                    { order: 5, label: 'Prueba de funcionamiento', type: FieldType.CHECKBOX, required: true },
                    { order: 6, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 7, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    // Mobiliario y Enseres
    const mobPreventivo = await prisma.checklist.upsert({
        where: { id: 'cl-mob-prev' },
        update: {},
        create: {
            id: 'cl-mob-prev', name: 'MP Preventivo - Mobiliario',
            description: 'Mantenimiento preventivo para muebles de oficina y bodega',
            maintenanceType: MaintenanceType.PREVENTIVE,
            items: {
                create: [
                    { order: 0, label: 'Inspección visual (rayones, golpes, óxido)', type: FieldType.CHECKBOX, required: true },
                    { order: 1, label: 'Limpieza general', type: FieldType.CHECKBOX, required: true },
                    { order: 2, label: 'Ajuste de tornillos y herrajes', type: FieldType.CHECKBOX, required: true },
                    { order: 3, label: 'Lubricación de cierres y rieles', type: FieldType.CHECKBOX, required: false },
                    { order: 4, label: 'Revisión de estabilidad y firmeza', type: FieldType.CHECKBOX, required: true },
                    { order: 5, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 6, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    const mobCorrectivo = await prisma.checklist.upsert({
        where: { id: 'cl-mob-corr' },
        update: {},
        create: {
            id: 'cl-mob-corr', name: 'MC Correctivo - Mobiliario',
            description: 'Reparación de muebles y enseres',
            maintenanceType: MaintenanceType.CORRECTIVE,
            items: {
                create: [
                    { order: 0, label: 'Descripción del daño', type: FieldType.TEXT, required: true },
                    { order: 1, label: 'Repuesto o material utilizado', type: FieldType.TEXT, required: false },
                    { order: 2, label: 'Reparación completada', type: FieldType.CHECKBOX, required: true },
                    { order: 3, label: 'Observaciones', type: FieldType.TEXT, required: false },
                    { order: 4, label: 'Firma del técnico', type: FieldType.SIGNATURE, required: true },
                ],
            },
        },
    });

    console.log('✅ Checklists por categoría creados');

    // ── ASIGNAR CHECKLISTS A CATEGORÍAS ─────────────────────────────────
    const catTec = await prisma.category.findFirst({ where: { name: 'Tecnológico' } });
    const catBio = await prisma.category.findFirst({ where: { name: 'Biomédico' } });
    const catInfra = await prisma.category.findFirst({ where: { name: 'Infraestructura' } });
    const catVeh = await prisma.category.findFirst({ where: { name: 'Vehículos' } });
    const catMaq = await prisma.category.findFirst({ where: { name: 'Maquinaria y Equipo' } });
    const catMob = await prisma.category.findFirst({ where: { name: 'Mobiliario y Enseres' } });

    const checklistCategoryMap: Record<string, string> = {
        'cl-tech-prev': 'Tecnológico', 'cl-tech-corr': 'Tecnológico', 'cl-tech-pred': 'Tecnológico',
        'checklist-preventivo-pc': 'Tecnológico',
        'cl-bio-prev': 'Biomédico', 'cl-bio-corr': 'Biomédico',
        'cl-infra-prev': 'Infraestructura', 'cl-infra-corr': 'Infraestructura',
        'cl-veh-prev': 'Vehículos', 'cl-veh-corr': 'Vehículos',
        'cl-maq-prev': 'Maquinaria y Equipo', 'cl-maq-corr': 'Maquinaria y Equipo',
        'cl-mob-prev': 'Mobiliario y Enseres', 'cl-mob-corr': 'Mobiliario y Enseres',
    };

    for (const [clId, catName] of Object.entries(checklistCategoryMap)) {
        const cat = await prisma.category.findFirst({ where: { name: catName } });
        if (cat) {
            await prisma.checklist.update({
                where: { id: clId },
                data: { categories: { connect: { id: cat.id } } },
            });
        }
    }

    console.log('✅ Checklists asignados a categorías');

    // ── SAMPLE ASSETS ─────────────────────────────────────────────────────
    const techCat = await prisma.category.findFirst({ where: { name: 'Tecnologico' } });
    const mainLoc = await prisma.location.findFirst({ where: { name: 'Oficina Principal' } });
    const dellSup = await prisma.supplier.findFirst({ where: { name: 'Dell Colombia' } });

    if (techCat && mainLoc && dellSup) {
        const desktopSub = await prisma.subcategory.findFirst({ where: { name: 'Computadores de Escritorio', categoryId: techCat.id } });
        const laptopSub = await prisma.subcategory.findFirst({ where: { name: 'Portátiles / Laptops', categoryId: techCat.id } });
        const monitorSub = await prisma.subcategory.findFirst({ where: { name: 'Monitores', categoryId: techCat.id } });

        const assets = [
            { code: 'EGAN-PC-001', name: 'PC-001 Dell Optiplex', qrCode: 'QR-PC-001', status: AssetStatus.ACTIVE, categoryId: techCat.id, subcategoryId: desktopSub?.id, locationId: mainLoc.id, supplierId: dellSup.id, acquisitionDate: new Date('2024-01-15'), acquisitionCost: 2800000 },
            { code: 'EGAN-LAP-001', name: 'LAP-001 Dell Latitude', qrCode: 'QR-LAP-001', status: AssetStatus.ACTIVE, categoryId: techCat.id, subcategoryId: laptopSub?.id, locationId: mainLoc.id, supplierId: dellSup.id, acquisitionDate: new Date('2024-03-20'), acquisitionCost: 4200000 },
            { code: 'EGAN-MON-001', name: 'MON-001 Dell 24"', qrCode: 'QR-MON-001', status: AssetStatus.ACTIVE, categoryId: techCat.id, subcategoryId: monitorSub?.id, locationId: mainLoc.id, supplierId: dellSup.id, acquisitionDate: new Date('2024-02-10'), acquisitionCost: 950000 },
            { code: 'EGAN-PC-002', name: 'PC-002 Dell Optiplex', qrCode: 'QR-PC-002', status: AssetStatus.MAINTENANCE, categoryId: techCat.id, subcategoryId: desktopSub?.id, locationId: mainLoc.id, supplierId: dellSup.id, acquisitionDate: new Date('2023-06-01'), acquisitionCost: 2500000 },
            { code: 'EGAN-LAP-002', name: 'LAP-002 Lenovo ThinkPad', qrCode: 'QR-LAP-002', status: AssetStatus.ACTIVE, categoryId: techCat.id, subcategoryId: laptopSub?.id, locationId: mainLoc.id, supplierId: dellSup.id, acquisitionDate: new Date('2024-05-10'), acquisitionCost: 3800000 },
        ];

        for (const asset of assets) {
            const existing = await prisma.asset.findFirst({ where: { code: asset.code } });
            if (!existing) {
                await prisma.asset.create({ data: asset });
            }
        }
        console.log('✅ Sample assets created');
    }

    // ── KNOWLEDGE BASE ───────────────────────────────────────────────────
    console.log('  Seeding Knowledge Base...');
    const kbCategories = [
        { name: 'Computadores', slug: 'computadores', icon: '💻', order: 1 },
        { name: 'Impresoras', slug: 'impresoras', icon: '🖨️', order: 2 },
        { name: 'Redes', slug: 'redes', icon: '🌐', order: 3 },
        { name: 'Biomédico', slug: 'biomedico', icon: '🏥', order: 4 },
        { name: 'Energía', slug: 'energia', icon: '⚡', order: 5 },
        { name: 'Soporte General', slug: 'soporte-general', icon: '🎧', order: 6 },
    ];

    const createdKbCats: Record<string, string> = {};
    for (const cat of kbCategories) {
        const created = await prisma.knowledgeCategory.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
        createdKbCats[cat.slug] = created.id;
    }

    const kbArticles = [
        { title: 'El equipo esta muy lento o tarda en encender', slug: 'equipo-lento-arranque', excerpt: 'Guia paso a paso para recuperar la velocidad de un equipo Windows o Linux.', content: 'Guia de diagnostico y solucion para equipos lentos.', difficulty: 'BASICO', estimatedMinutes: 5, categoryId: createdKbCats['computadores'] },
        { title: 'No tengo internet en mi equipo', slug: 'sin-internet-equipo', excerpt: 'Diagnostico de conectividad para equipos cableados e inalambricos.', content: 'Pasos para diagnosticar problemas de conectividad de red.', difficulty: 'BASICO', estimatedMinutes: 3, categoryId: createdKbCats['redes'] },
        { title: 'La impresora no imprime o aparece offline', slug: 'impresora-no-imprime', excerpt: 'Pasos para resolver impresion atascada, offline o con errores de spooler.', content: 'Guia completa para resolver problemas de impresion.', difficulty: 'BASICO', estimatedMinutes: 5, categoryId: createdKbCats['impresoras'] },
        { title: 'Equipo biomedico no enciende o presenta alarma', slug: 'biomedico-no-enciende', excerpt: 'Procedimiento inicial ante fallas de energia o alarmas en equipos medicos.', content: 'Procedimiento seguro ante fallas de equipos biomedicos.', difficulty: 'INTERMEDIO', estimatedMinutes: 4, categoryId: createdKbCats['biomedico'] },
        { title: 'El UPS no enciende o se apaga solo', slug: 'ups-no-enciende', excerpt: 'Diagnostico de UPS: bateria, sobrecarga y ventilacion.', content: 'Diagnostico y solucion para problemas de UPS.', difficulty: 'BASICO', estimatedMinutes: 4, categoryId: createdKbCats['energia'] },
        { title: 'Olide mi contrasena / Cuenta bloqueada', slug: 'cuenta-bloqueada-contrasena', excerpt: 'Pasos para recuperar acceso a cuentas corporativas.', content: 'Pasos para recuperar acceso a cuentas bloqueadas.', difficulty: 'BASICO', estimatedMinutes: 2, categoryId: createdKbCats['soporte-general'] },
        { title: 'No puedo imprimir en red compartida', slug: 'imprimir-red-compartida', excerpt: 'Resolver cuando un equipo no ve la impresora de red o compartida.', content: 'Guia para resolver problemas de impresion en red.', difficulty: 'INTERMEDIO', estimatedMinutes: 5, categoryId: createdKbCats['impresoras'] },
        { title: 'Equipo se apaga solo o se reinicia inesperadamente', slug: 'equipo-se-apaga-solo', excerpt: 'Diagnostico de fallas de energia, temperatura y hardware.', content: 'Diagnostico de apagados inesperados.', difficulty: 'INTERMEDIO', estimatedMinutes: 6, categoryId: createdKbCats['computadores'] },
        { title: 'Pantalla azul (BSOD) o pantalla negra', slug: 'pantalla-azul-bsod', excerpt: 'Interpretar codigos de detencion y recuperar el sistema.', content: 'Guia para resolver pantallazos azules.', difficulty: 'INTERMEDIO', estimatedMinutes: 5, categoryId: createdKbCats['computadores'] },
        { title: 'Configurar correo en Outlook o cliente de correo', slug: 'configurar-correo-outlook', excerpt: 'Configuracion IMAP/SMTP para clientes de correo corporativo.', content: 'Pasos para configurar correo corporativo.', difficulty: 'BASICO', estimatedMinutes: 3, categoryId: createdKbCats['soporte-general'] },
        { title: 'Configurar VPN para acceso remoto', slug: 'configurar-vpn', excerpt: 'Conectar a la red corporativa desde fuera de la oficina.', content: 'Guia para configurar acceso VPN.', difficulty: 'INTERMEDIO', estimatedMinutes: 4, categoryId: createdKbCats['redes'] },
    ];

    for (const article of kbArticles) {
        await prisma.knowledgeArticle.upsert({
            where: { slug: article.slug },
            update: {},
            create: article,
        });
    }
    console.log('✅ Knowledge Base seeded');

    console.log(`🚀 Database seeded successfully!`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
