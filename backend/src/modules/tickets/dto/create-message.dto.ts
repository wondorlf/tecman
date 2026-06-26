import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTicketMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
