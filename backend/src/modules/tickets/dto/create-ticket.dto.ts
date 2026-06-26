import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Priority, TicketCategory } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(TicketCategory)
  category: TicketCategory;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  macAddress?: string; // From Agent

  @IsOptional()
  @IsString()
  reportedUser?: string; // From Agent

  @IsOptional()
  @IsString()
  creatorName?: string; // From public portal

  @IsOptional()
  @IsString()
  creatorPhone?: string; // From public portal
}
