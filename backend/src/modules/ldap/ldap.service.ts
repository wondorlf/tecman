import { Injectable, Logger } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as ldap from 'ldapjs';

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);

  constructor(
    private readonly tenantsService: TenantsService,
    private readonly prisma: PrismaService,
  ) {}

  async createClient() {
    const settings = (await this.tenantsService.getTenantSettings()) as {
      ldapUrl?: string;
      ldapBindDn?: string;
      ldapBindPassword?: string;
      ldapBaseDn?: string;
      ldapUserFilter?: string;
    };
    if (!settings || !settings.ldapUrl) {
      throw new Error('LDAP configuration is missing');
    }

    const client = ldap.createClient({
      url: settings.ldapUrl,
    });

    return { client, settings };
  }

  async testConnection() {
    const { client, settings } = await this.createClient();

    return new Promise((resolve, reject) => {
      client.bind(settings.ldapBindDn || '', settings.ldapBindPassword || '', (err) => {
        if (err) {
          this.logger.error(`LDAP Bind failed: ${err.message}`);
          client.unbind();
          return reject(err);
        }
        this.logger.log('LDAP Connection successful');
        client.unbind();
        resolve(true);
      });
    });
  }

  async syncUsers() {
    const { client, settings } = await this.createClient();

    return new Promise((resolve, reject) => {
      client.bind(settings.ldapBindDn || '', settings.ldapBindPassword || '', (err) => {
        if (err) {
          client.unbind();
          return reject(err);
        }

        const searchOptions: ldap.SearchOptions = {
          filter: settings.ldapUserFilter || '(&(objectClass=user)(objectCategory=person))',
          scope: 'sub',
          attributes: ['dn', 'sAMAccountName', 'mail', 'displayName', 'telephoneNumber'],
        };

        const users: Record<string, unknown>[] = [];

        client.search(settings.ldapBaseDn || '', searchOptions, (err, res) => {
          if (err) {
            client.unbind();
            return reject(err);
          }

          res.on('searchEntry', (entry) => {
            const user = (entry as any).object;
            users.push(user);
          });

          res.on('error', (err) => {
            this.logger.error(`LDAP Search error: ${err.message}`);
            client.unbind();
            reject(err);
          });

          res.on('end', async (_result) => {
            this.logger.log(`LDAP User Search completed. Found ${users.length} users.`);
            await this.processSyncedUsers(users);
            client.unbind();
            resolve({ count: users.length });
          });
        });
      });
    });
  }

  async syncComputers() {
    const { client, settings } = await this.createClient();

    return new Promise((resolve, reject) => {
      client.bind(settings.ldapBindDn || '', settings.ldapBindPassword || '', (err) => {
        if (err) {
          client.unbind();
          return reject(err);
        }

        const searchOptions: ldap.SearchOptions = {
          filter: '(objectClass=computer)',
          scope: 'sub',
          attributes: ['dn', 'cn', 'operatingSystem', 'dNSHostName'],
        };

        const computers: Record<string, unknown>[] = [];

        client.search(settings.ldapBaseDn || '', searchOptions, (err, res) => {
          if (err) {
            client.unbind();
            return reject(err);
          }

          res.on('searchEntry', (entry) => {
            computers.push((entry as any).object);
          });

          res.on('end', async () => {
            this.logger.log(`LDAP Computer Search completed. Found ${computers.length} computers.`);
            await this.processSyncedComputers(computers);
            client.unbind();
            resolve({ count: computers.length });
          });
        });
      });
    });
  }

  private async processSyncedUsers(ldapUsers: any[]) {
    const defaultRole = await this.prisma.role.findFirst({ where: { name: 'Auditor' } });

    for (const ldapUser of ldapUsers) {
      const email = ldapUser.mail;
      const username = ldapUser.sAMAccountName;
      const name = ldapUser.displayName || username;

      if (!email || !username) continue;

      await (this.prisma.user as any).upsert({
        where: { email },
        update: {
          username,
          name,
          phone: ldapUser.telephoneNumber || null,
        },
        create: {
          email,
          username,
          name,
          password: 'LDAP_USER_' + Math.random().toString(36).slice(-8),
          roleId: defaultRole?.id || '',
          active: true,
        },
      });
    }
  }

  private async processSyncedComputers(ldapComputers: any[]) {
    for (const computer of ldapComputers) {
      const hostname = computer.cn || computer.dNSHostName;
      if (!hostname) continue;

      // We use a dummy MAC if it's from LDAP and not discovered yet
      const dummyMac = `LDAP-${hostname}`;

      await this.prisma.discoveredDevice.upsert({
        where: { macAddress: dummyMac },
        update: {
          hostname,
          os: computer.operatingSystem || 'Windows',
        },
        create: {
          macAddress: dummyMac,
          hostname,
          os: computer.operatingSystem || 'Windows',
        },
      });
    }
  }
}
