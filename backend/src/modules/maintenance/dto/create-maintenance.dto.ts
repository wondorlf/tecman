import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { MaintenanceType, MaintenanceStatus, Priority } from '@prisma/client';

export class CreateMaintenanceDto {
  @IsString()
  assetId: string;

  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  checklistId?: string;

  @IsOptional()
  @IsString()
  checklistData?: string;
}
