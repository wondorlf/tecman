import { IsOptional, IsString, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CompleteMaintenanceDto {
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsObject()
  checklistData?: Record<string, unknown>;
}
