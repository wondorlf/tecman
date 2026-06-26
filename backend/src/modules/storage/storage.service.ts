import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private jwtService: JwtService) {
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);
    return filename;
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  async deleteFile(filename: string) {
    const filePath = this.getFilePath(filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  /**
   * Cleanup orphaned files — archivos en el directorio uploads que no están
   * referenciados por ningún documento en la base de datos.
   * @param knownFilenames Lista opcional de filenames conocidos; si no se pasa,
   *   se consulta la BD automáticamente (requiere PrismaService inyectado).
   */
  async cleanupOrphanedFiles(knownFilenames?: string[]): Promise<number> {
    let dbFilenames: string[];
    if (knownFilenames) {
      dbFilenames = knownFilenames;
    } else {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      try {
        const docs = await prisma.document.findMany({ select: { filename: true } });
        dbFilenames = docs.map((d: { filename: string }) => d.filename);
      } finally {
        await prisma.$disconnect();
      }
    }

    const fileSet = new Set(dbFilenames);
    let deleted = 0;

    try {
      const allFiles = await fs.promises.readdir(this.uploadDir);
      for (const file of allFiles) {
        if (!fileSet.has(file)) {
          const filePath = path.join(this.uploadDir, file);
          try {
            await fs.promises.unlink(filePath);
            deleted++;
            this.logger.log(`Archivo huérfano eliminado: ${file}`);
          } catch (e) {
            this.logger.warn(`No se pudo eliminar archivo huérfano ${file}: ${(e as Error).message}`);
          }
        }
      }
    } catch (e) {
      this.logger.warn(`Error al leer directorio uploads: ${(e as Error).message}`);
    }

    this.logger.log(`Limpieza completada: ${deleted} archivos huérfanos eliminados`);
    return deleted;
  }

  generatePresignedUrl(filename: string, expiresIn = '1h'): string {
    return this.jwtService.sign({ filename }, { expiresIn });
  }

  verifyPresignedUrl(token: string): string {
    try {
      const payload = this.jwtService.verify(token);
      return payload.filename;
    } catch (e) {
      throw new Error('Invalid or expired token');
    }
  }
}
