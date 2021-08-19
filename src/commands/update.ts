import { MessageContext } from 'vk-io';

import { Command, Context } from '@/core';
import { updateWidget } from '@/modules';

export const updateCommand = new Command({
  trigger: /^\/update$/i,
  handler: async (context: Context) => {
    // Недостаточно прав - игнорим
    if (context.user.rights < 1) return;

    // Будем редактировать отправленное сообщение, так красивее
    const message: MessageContext = await context.reply(
      '⚙️ Обновление виджета с топом тиктоков...'
    );
    return updateWidget()
      .then(() =>
        message.editMessage({ message: '🤖 Виджет успешно обновлён!' })
      )
      .catch((e: any) =>
        message.editMessage({
          message: '❗️ Ошибка при обновлении виджета: ' + e
        })
      );
  }
});
