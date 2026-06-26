import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceType } from '@prisma/client';

export class ChecklistItemDto {
  @IsInt()
  @Min(1)
  order: number;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  type: string;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsString()
  options?: string;
}

export class CreateChecklistDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaintenanceType)
  maintenanceType?: MaintenanceType;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items?: ChecklistItemDto[];
}
