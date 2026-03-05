import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: { role: true }
        });
        console.log('--- USERS ---');
        console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role?.name })), null, 2));
        console.log('-------------');
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
