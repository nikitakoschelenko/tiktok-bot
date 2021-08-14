import { join } from 'path';

import { Logger, vk, telegram } from '@/utils';
import { Core } from '@/core';

const log: Logger = new Logger('VK');

export default async function coreLoader(): Promise<void> {
  const core: Core = new Core({
    vk,
    telegram,
    middlewaresPath: join(__dirname, '..', 'middlewares'),
    commandsPath: join(__dirname, '..', 'commands')
  });

  try {
    await core.load();

    await core.startVK().then(() => log.info('Успешное подключение к VK'));
    await core
      .startTelegram()
      .then(() => log.info('Успешное подключение к Telegram'));
  } catch (err) {
    log.error(err);
  }
}
