import { getMongoRepository } from 'typeorm';

import { Command, Context } from '@/core';
import { User } from '@/entities';
import { Logger, vk } from '@/utils';
import { canUseJS } from '@/config';

const log: Logger = new Logger('JS');

export const jsCommand = new Command({
  trigger: /^\/code ((?:.|\s)+)$/i,
  handler: async (context: Context) => {
    // Недостаточно прав - игнорим
    if (!context.senderId || !canUseJS.includes(context.senderId)) return;

    // Контекст для выполнения
    const scope: Record<string, any> = {
      getUserRepository: () => getMongoRepository(User),
      vk,
      context
    };

    try {
      const res: any = await new Function(
        `with (this) { return eval("${context.$match[1]}"); }`
      ).call(scope);

      return context.reply(`🤖 Ответ: ${JSON.stringify(res)}`);
    } catch (e) {
      log.error(e);

      return context.reply(`❗️ Ошибка: ${e.toString()}`);
    }
  }
});
