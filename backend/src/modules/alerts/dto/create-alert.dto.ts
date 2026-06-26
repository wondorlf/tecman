import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AlertType, Priority } from '@prisma/client';

export class CreateAlertDto {
  @IsString()
  assetId: string;

  @IsEnum(AlertType)
  type: AlertType;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}
