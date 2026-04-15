import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { postgresUrlFromEnv } from '@/common/utils/postgres-url.util';
import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  public constructor() {
    const pool = new Pool({ connectionString: postgresUrlFromEnv() });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }
  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
