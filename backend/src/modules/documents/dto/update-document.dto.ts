import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
