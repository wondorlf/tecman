import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Fixing user egan@tecman.com...');

    // 1. Get Admin Role
    const adminRole = await prisma.role.findFirst({
        where: { name: 'Administrador' }
    });

    if (!adminRole) {
        throw new Error('❌ Role "Administrador" not found. Run seed first.');
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash('egan', 10);

    // 3. Upsert User
    const user = await prisma.user.upsert({
        where: { email: 'egan@tecman.com' },
        update: {
            password: hashedPassword,
            roleId: adminRole.id,
            active: true
        },
        create: {
            email: 'egan@tecman.com',
            password: hashedPassword,
            name: 'Superadministrador Egan',
            roleId: adminRole.id,
            active: true
        },
    });

    console.log(`✅ User ${user.email} updated successfully!`);
    console.log(`🔑 Password set to: "egan"`);
    console.log(`🆔 ID: ${user.id}`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
