import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    return this.prisma.knowledgeCategory.findMany({ orderBy: { order: 'asc' } });
  }

  async listArticles(categoryId?: string, search?: string) {
    const where: Record<string, unknown> = { active: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }
    return this.prisma.knowledgeArticle.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!article) throw new NotFoundException('Artículo no encontrado');
    await this.prisma.knowledgeArticle.update({ where: { id }, data: { views: { increment: 1 } } });
    return article;
  }

  async rate(id: string, helpful: boolean) {
    const data = helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } };
    return this.prisma.knowledgeArticle.update({ where: { id }, data });
  }

  async create(data: any) {
    return this.prisma.knowledgeArticle.create({ data, include: { category: true } });
  }

  async update(id: string, data: any) {
    return this.prisma.knowledgeArticle.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.prisma.knowledgeArticle.delete({ where: { id } });
    return { success: true };
  }
}
