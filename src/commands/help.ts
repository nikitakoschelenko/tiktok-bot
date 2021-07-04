import { stripIndents } from 'common-tags';

import { AbstractCommand, Context } from '@/core';

export class Help implements AbstractCommand {
  trigger = /^\/помощь|начать|start$/i;
  payload = 'start';

  async handler(context: Context) {
    return context.send(stripIndents`
      😊 Я умею отвечать на сообщение с ссылкой на TikTok видео по этой ссылке. Предназначен для использования в беседе, но могу и в личных сообщениях :3
      📚 Подробнее обо мне и моей настройке - https://vk.com/@tiktokbot-info
    `);
  }
}
