import { getMongoRepository, MongoRepository } from 'typeorm';
import axios, { AxiosResponse } from 'axios';
import { MessageContext, VideoAttachment } from 'vk-io';
import { GroupsGetMembersResponse } from 'vk-io/lib/api/schemas/responses';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Context, Middleware } from '@/core';
import { User } from '@/entities';
import { isVK, Logger, userVK, vk } from '@/utils';
import { axiosConfig, vkGroupId } from '@/config';

const userRepository: MongoRepository<User> = getMongoRepository(User);
const log: Logger = new Logger('MessageMW');

export const messageMiddleware = new Middleware({
  middleware: async (
    context: Context,
    next: NextMiddleware
  ): Promise<NextMiddlewareReturn> => {
    if ((!context.text && !context.forwards) || !context.senderId)
      return next();

    const allText: string =
      (context.text ?? '') +
      '; ' +
      (isVK(context) && context.forwards
        ? context.forwards
            .map((forward: MessageContext) => forward.text)
            .join('; ')
        : '');

    const regex: RegExp = /http(?:s|):\/\/(?:\w+.|)tiktok.com\/[\w\d/@]+/gi;
    const matches: RegExpMatchArray | null = allText.match(regex);

    if (!matches || matches.length < 1) return next();

    if (isVK(context)) await context.setActivity();
    else await context.sendChatAction('upload_video');

    // В бане - игнорим
    if (context.user.rights < 0) return;

    let isDon: boolean;

    if (isVK(context)) {
      const dons: GroupsGetMembersResponse = await vk.api.groups.getMembers({
        group_id: vkGroupId.toString(),
        filter: 'donut'
      });

      isDon = dons.items.some((id: number) => id === context.senderId);
    } else isDon = false;
    // TODO: Доны в Телеграме

    if (
      Date.now() - context.user.lastSend < (isDon ? 30000 : 60000) &&
      context.user.rights < 1
    )
      return context.reply(
        '⏰ Превышен лимит TikTok&#39;ов, попробуйте снова через минуту :3'
      );

    const attachment: VideoAttachment[] = [];

    let isErrorOccured: boolean = false;

    for (const url of isDon || context.user.rights >= 1
      ? matches.slice(0, 5)
      : matches.slice(0, 1)) {
      try {
        const res: AxiosResponse = await axios.get(url, axiosConfig);
        const html: string = res.data;

        const part: string = html.split('"downloadAddr":"')[1];
        const rawUrl: string = part.split('","shareCover":')[0];

        const downloadUrl: string = rawUrl.replace(/\\u0026/g, '&');

        const video: AxiosResponse = await axios.get(downloadUrl, {
          ...axiosConfig,
          responseType: 'arraybuffer'
        });

        if (isVK(context)) {
          const videoAttachment: VideoAttachment = await userVK.upload.video({
            source: {
              value: video.data
            },
            name: 'TikTok - ' + url
          });

          attachment.push(videoAttachment);
        } else context.sendVideo(video.data);
        // TODO: Здесь ошибка, так как боты могут отправлять видео размера до 50Мб. Для тиктоков это очень мало
      } catch (e) {
        log.error(e);

        isErrorOccured = true;
      }
    }

    context.user.lastSend = Date.now();
    context.user.timestamps.push(Date.now());

    await userRepository.save(context.user);

    // Дико, но работает
    return context.reply(
      ((context.user.rights < 1 && !isDon && matches.length > 1) ||
      (context.user.rights < 1 && isDon && matches.length > 5)
        ? '⏰ Ты прислал больше TikTok&#39;ов, чем позволяют лимиты, из-за этого не все видео были загружены' +
          (!isDon
            ? '. Купи подписку 🍩 VK Donut и загружай до 5 TikTok&#39;ов на сообщение!\n'
            : '\n')
        : '') +
        (!context.isChat
          ? '😇 Вообще я предназначен для работы в беседе, но для тебя сделаю исключение\n'
          : '') +
        (isErrorOccured
          ? '🤬 Некоторые видео не были загружены из-за ошибки\n'
          : '') +
        (isDon
          ? '🍩 Спасибо за подписку VK Donut на наше сообщество :3\n'
          : '') +
        `\n#tiktok #user${context.senderId}`,
      isVK(context) ? { attachment } : {}
    );
  }
});
