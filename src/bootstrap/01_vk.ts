import { join } from 'path';

import { Logger, vk } from '@/utils';
import { Core } from '@/core';

const log: Logger = new Logger('VK');

export default async function vkLoader(): Promise<void> {
  const core: Core = new Core(vk, {
    middlewares: join(__dirname, '..', 'middlewares'),
    commands: join(__dirname, '..', 'commands')
  });

  await core.load();

  return core
    .start()
    .then(() => void log.info(`Успешное подключение к VK`))
    .catch((err: string) => void log.error(err));
}
