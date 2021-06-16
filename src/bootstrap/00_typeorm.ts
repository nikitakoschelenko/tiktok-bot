import { ConnectionOptions, createConnection } from 'typeorm';
import { join } from 'path';

import { Logger } from '@/utils';
import { databaseURI } from '@/config';

export const connectionOptions: ConnectionOptions = {
  type: 'mongodb',
  url: databaseURI,
  logging: process.env.NODE_ENV !== 'production',
  entities: [join(__dirname, '../entities/**/*.{js,ts}')],
  useUnifiedTopology: true
};

export default async function typeormLoader(): Promise<void> {
  const log = new Logger('TypeORM');

  await createConnection(connectionOptions)
    .then(() => log.info('Подключён к MongoDB'))
    .catch(log.error);
}
