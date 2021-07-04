import {
  Attachment,
  ExternalAttachment,
  Keyboard,
  VideoAttachment
} from 'vk-io';
import { WallPostResponse } from 'vk-io/lib/api/schemas/responses';
import { Answer } from 'vk-io-question';
import { stripIndents } from 'common-tags';

import { AbstractCommand, Context } from '@/core';
import { groupId } from '@/config';
import { Logger, userVK } from '@/utils';

export class Post implements AbstractCommand {
  log: Logger = new Logger('Runtime');

  trigger = /^\/отложить ((?:\s|.)+)$/i;
  rights = 1;

  async handler(context: Context) {
    if (!context.replyMessage || context.replyMessage.senderId !== -groupId)
      return context.reply(stripIndents`
        ❗️ Ответьте на сообщение бота с видео, чтобы отложить пост в группу
      `);

    const foundVideo: VideoAttachment | undefined =
      context.replyMessage.attachments.filter(
        // @ts-ignore
        (attachment: Attachment | ExternalAttachment) =>
          attachment.type === 'video'
      )[0] as unknown as VideoAttachment | undefined;

    if (!foundVideo)
      return context.reply(stripIndents`
        ❗️ Не удалось найти видео в сообщении
      `);

    const answer: Answer = await context.question(
      stripIndents`
      🎬 Название: ${foundVideo.title}
      📖 Текст: ${context.$match[1]}

      😊 Откладываем пост в группу?
    `,
      {
        targetUserId: context.senderId,
        answerTimeLimit: 60000,
        keyboard: Keyboard.builder()
          .oneTime()
          .textButton({
            label: 'Нет',
            color: Keyboard.NEGATIVE_COLOR,
            payload: { command: 'no' }
          })
          .textButton({
            label: 'Да',
            color: Keyboard.POSITIVE_COLOR,
            payload: { command: 'yes' }
          })
      }
    );
    if (!answer.text?.includes('Да') && answer.payload?.command !== 'yes')
      return context.reply(stripIndents`
        ❗️ Создание поста отменено
      `);

    try {
      const response: WallPostResponse = await userVK.api.wall.post({
        owner_id: -groupId,
        message: context.$match[1],
        attachments: foundVideo.toString(),
        publish_date: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      });

      return context.reply(stripIndents`
        🤙 Отложил запись - https://vk.com/public${groupId}?w=wall-${groupId}_${response.post_id}
      `);
    } catch (e) {
      this.log.error(e);

      return context.reply(stripIndents`
        ❗️ Произошла ошибка при попытке создания поста: ${e}
      `);
    }
  }
}
