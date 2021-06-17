import { MessageContext } from 'vk-io';
import { AbstractCommand, Context } from '@/core';
import { Logger } from '@/utils';

const log: Logger = new Logger('JS');

export class JS implements AbstractCommand {
  trigger = /^!js ((?:.|\s)+)$/i;

  async handler(context: Context): Promise<MessageContext | void> {
    if (context.senderId !== 435214391) return;

    try {
      const res: any = await eval(context.$match[1]);

      return context.reply(`✔️ Ответ: ` + JSON.stringify(res));
    } catch (e) {
      log.error(e);

      return context.reply(`❌ Ошибка: ${e.toString()}`);
    }
  }
}
