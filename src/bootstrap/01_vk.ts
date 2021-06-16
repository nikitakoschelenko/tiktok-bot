import { VK } from 'vk-io';
import { join } from 'path';

import { Logger, vk } from '@/utils';
import { Commander } from '@/core';
import {
  contextMiddleware,
  inviteMiddleware,
  messageMiddleware
} from '@/middlewares';
import { groupId } from '@/config';

const log = new Logger('VK');

export default async function vkLoader(): Promise<void> {
  const commander = new Commander();
  await commander.loadFromDirectory(join(__dirname, '..', 'commands'));

  vk.updates.use(
    contextMiddleware({
      vk,
      commander,
      groupId
    })
  );
  vk.updates.use(inviteMiddleware);
  vk.updates.use(messageMiddleware);
  vk.updates.use(commander.middleware);

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
