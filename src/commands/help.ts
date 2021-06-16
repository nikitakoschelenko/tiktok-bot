import { stripIndents } from 'common-tags';

import { Command, Context } from '@/core';

export default new Command({
  trigger: /^!помощь|!начать|начать$/i,
  payload: 'start',
  description: 'Помощь',
  async handler(context: Context) {
    return context.send(stripIndents`
      🍩 Я умею отвечать на сообщение с ссылкой на TikTok видео по этой ссылке. Предназначен для использования в беседе :3
      ☺️ Подробнее обо мне и моей настройке - https://vk.com/@tiktokbot1-info
    `);
  }
});
