import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MaintenanceType, FieldType } from '@prisma/client';

interface CreateChecklistDto {
    name: string;
    description?: string;
    maintenanceType?: MaintenanceType;
    items: {
        label: string;
        description?: string;
        type: FieldType;
        required?: boolean;
        options?: any;
        validation?: any;
        conditional?: any;
    }[];
}

@Injectable()
export class ChecklistsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: CreateChecklistDto) {
        const { items, ...checklistData } = data;

        return this.prisma.checklist.create({
            data: {
                ...checklistData,
                items: {
                    create: items.map((item, index) => ({
                        ...item,
                        order: index,
                    })),
                },
            },
            include: { items: { orderBy: { order: 'asc' } } },
        });
    }

    async findAll(params?: { categoryId?: string; maintenanceType?: MaintenanceType }) {
        const { categoryId, maintenanceType } = params || {};
        const where: any = { active: true };
        if (maintenanceType) where.maintenanceType = maintenanceType;

        // Many-to-many relation with categories
        if (categoryId) {
            where.categories = { some: { id: categoryId } };
        }

        return this.prisma.checklist.findMany({
            where,
            include: {
                categories: { select: { id: true, name: true } },
                _count: { select: { items: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const checklist = await this.prisma.checklist.findUnique({
            where: { id },
            include: {
                categories: true,
                items: { orderBy: { order: 'asc' } },
            },
        });
        if (!checklist) throw new NotFoundException(`Checklist ${id} not found`);
        return checklist;
    }

    async update(id: string, data: Partial<{ name: string; description: string; active: boolean }>) {
        await this.findOne(id);
        return this.prisma.checklist.update({ where: { id }, data });
    }

    async updateItems(
        id: string,
        items: { label: string; type: FieldType; required?: boolean; options?: any }[],
    ) {
        await this.findOne(id);

        // Delete existing items and recreate
        await this.prisma.checklistItem.deleteMany({ where: { checklistId: id } });

        await this.prisma.checklistItem.createMany({
            data: items.map((item, index) => ({
                checklistId: id,
                label: item.label,
                type: item.type,
                required: item.required || false,
                options: item.options,
                order: index,
            })),
        });

        return this.findOne(id);
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.checklist.delete({ where: { id } });
        return { message: 'Checklist deleted' };
    }

    async duplicate(id: string, newName: string) {
        const original = await this.findOne(id);

        return this.prisma.checklist.create({
            data: {
                name: newName,
                description: original.description,
                maintenanceType: original.maintenanceType,
                items: {
                    create: original.items.map((item) => ({
                        order: item.order,
                        label: item.label,
                        description: item.description,
                        type: item.type,
                        required: item.required,
                        options: item.options as any,
                        validation: item.validation as any,
                        conditional: item.conditional as any,
                    })),
                },
            },
            include: { items: { orderBy: { order: 'asc' } } },
        });
    }
}
