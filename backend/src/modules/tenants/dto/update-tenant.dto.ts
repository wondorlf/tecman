import { IsString, IsOptional, IsBoolean, IsHexColor } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  // Datos de la empresa para PDFs e informes
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  companyLogoUrl?: string;

  @IsString()
  @IsOptional()
  companyDocument?: string;

  @IsString()
  @IsOptional()
  companyAddress?: string;

  @IsString()
  @IsOptional()
  companyPhone?: string;

  @IsString()
  @IsOptional()
  companyEmail?: string;

  @IsHexColor()
  @IsOptional()
  primaryColor?: string;

  @IsHexColor()
  @IsOptional()
  secondaryColor?: string;

  @IsString()
  @IsOptional()
  supportPortalTitle?: string;

  @IsString()
  @IsOptional()
  supportPortalSubtitle?: string;

  @IsString()
  @IsOptional()
  supportPortalBackgroundUrl?: string;

  @IsString()
  @IsOptional()
  telegramBotToken?: string;

  @IsString()
  @IsOptional()
  telegramChatId?: string;

  @IsBoolean()
  @IsOptional()
  telegramNotificationsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  ldapEnabled?: boolean;

  @IsString()
  @IsOptional()
  ldapUrl?: string;

  @IsString()
  @IsOptional()
  ldapBindDn?: string;

  @IsString()
  @IsOptional()
  ldapBindPassword?: string;

  @IsString()
  @IsOptional()
  ldapBaseDn?: string;

  @IsString()
  @IsOptional()
  ldapUserFilter?: string;

  @IsString()
  @IsOptional()
  ldapGroupFilter?: string;

  @IsString()
  @IsOptional()
  discoveryApiKey?: string;
}
