import { VK } from 'vk-io';
import { join } from 'path';

import { Logger, vk } from '@/utils';
import { Core, MiddlewareType } from '@/core';

const log: Logger = new Logger('VK');

export default async function vkLoader(): Promise<void> {
  const core: Core = new Core();

  await core.loadCommands(join(__dirname, '..', 'commands'));
  await core.loadMiddlewares(join(__dirname, '..', 'middlewares'));

  for (const middleware of core.getMiddlewares(MiddlewareType.BEFORE))
    vk.updates.use(new middleware().middleware);

  vk.updates.use(core.middleware);

  for (const middleware of core.getMiddlewares(MiddlewareType.AFTER))
    vk.updates.use(new middleware().middleware);

  startPolling(vk);
}

const startPolling = (vk: VK): void => {
  vk.updates
    .start()
    .then(() => log.info('Успешное подключение к VK'))
    .catch((err) => {
      log.info('VK').error(err);
      log.info('VK').info('Повтор попытки подключения...');

      startPolling(vk);
    });
};
