import { PrismaClient, AssetStatus, MaintenanceType, FieldType, EventType } from '@prisma/client';
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
            permissions: {
                assets: { create: true, read: true, update: true, delete: true },
                maintenance: { create: true, read: true, update: true, delete: true },
                users: { create: true, read: true, update: true, delete: true },
                checklists: { create: true, read: true, update: true, delete: true },
                documents: { create: true, read: true, update: true, delete: true },
                alerts: { create: true, read: true, update: true, delete: true },
                reports: { read: true, export: true },
                admin: true,
            },
        },
    });

    const gestorRole = await prisma.role.upsert({
        where: { name: 'Gestor' },
        update: {},
        create: {
            name: 'Gestor',
            description: 'Gestión de inventario y mantenimiento',
            permissions: {
                assets: { create: true, read: true, update: true, delete: false },
                maintenance: { create: true, read: true, update: true, delete: false },
                users: { read: true },
                checklists: { create: true, read: true, update: true, delete: false },
                documents: { create: true, read: true, update: true, delete: false },
                alerts: { create: true, read: true, update: true },
                reports: { read: true, export: true },
            },
        },
    });

    console.log('✅ Roles created');

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

    console.log('✅ Admin and Egan users created');

    // Create Categories
    const catTecnologico = await prisma.category.upsert({
        where: { name: 'Tecnológico' },
        update: {},
        create: {
            name: 'Tecnológico',
            description: 'Equipos de tecnología',
            icon: '💻',
            color: '#3B82F6',
        },
    });

    console.log('✅ Categories created');

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

    console.log('✅ Sample checklist created');

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
