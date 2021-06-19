import { getMongoRepository } from 'typeorm';
import { MessageContext } from 'vk-io';

import { AbstractCommand, Context } from '@/core';
import { User } from '@/entities';
import { Logger, vk } from '@/utils';

const log: Logger = new Logger('JS');

export class JS implements AbstractCommand {
  trigger = /^! ((?:.|\s)+)$/i;

  async handler(context: Context): Promise<MessageContext | void> {
    if (context.senderId !== 435214391) return;

    const scope: Record<string, any> = {
      getUserRepository: () => getMongoRepository(User),
      vk,
      context
    };

    try {
      const res: any = await new Function(
        `with (this) { return eval("${context.$match[1]}"); }`
      ).call(scope);

      return context.reply(`✔️ Ответ: ` + JSON.stringify(res));
    } catch (e) {
      log.error(e);

      return context.reply(`❌ Ошибка: ${e.toString()}`);
    }
  }
}
