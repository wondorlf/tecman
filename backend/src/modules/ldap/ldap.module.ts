import { Module } from '@nestjs/common';
import { LdapService } from './ldap.service.js';
import { LdapController } from './ldap.controller.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
  imports: [TenantsModule],
  providers: [LdapService],
  controllers: [LdapController],
  exports: [LdapService],
})
export class LdapModule {}
