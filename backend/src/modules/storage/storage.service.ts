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
