import { Attachment, ExternalAttachment, VideoAttachment } from 'vk-io';
import { WallPostResponse } from 'vk-io/lib/api/schemas/responses';

import { Command, Context } from '@/core';
import { groupId } from '@/config';
import { Logger, userVK } from '@/utils';

const log: Logger = new Logger('Post');

export const postCommand = new Command({
  trigger: /^\/отложить ((?:\s|.)+)$/i,
  handler: async (context: Context) => {
    // Недостаточно прав - игнорим
    if (context.user.rights < 1) return;

    if (!context.replyMessage || context.replyMessage.senderId !== -groupId)
      return context.reply(
        '❗️ Ответьте на сообщение бота с видео, чтобы отложить пост в группу'
      );

    const foundVideo: VideoAttachment | undefined =
      context.replyMessage.attachments.filter(
        // Тут беда с типами
        // @ts-ignore
        (attachment: Attachment | ExternalAttachment) =>
          attachment.type === 'video'
      )[0] as unknown as VideoAttachment | undefined;

    if (!foundVideo)
      return context.reply('❗️ Не удалось найти видео в сообщении');

    try {
      const response: WallPostResponse = await userVK.api.wall.post({
        owner_id: -groupId,
        message: context.$match[1],
        attachments: foundVideo.toString(),
        publish_date: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      });

      return context.reply(
        `🤙 Отложил запись - https://vk.com/public${groupId}?w=wall-${groupId}_${response.post_id}`
      );
    } catch (e) {
      log.error(e);

      return context.reply(
        `❗️ Произошла ошибка при попытке создания поста: ${e}`
      );
    }
  }
});
