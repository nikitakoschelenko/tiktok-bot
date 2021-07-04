import { getMongoRepository } from 'typeorm';
import axios, { AxiosResponse } from 'axios';
import { MessageContext, VideoAttachment } from 'vk-io';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { AbstractMiddleware, MiddlewareType } from '@/core';
import { User } from '@/entities';
import { Logger, userVK, vk } from '@/utils';
import { axiosConfig, groupId } from '@/config';
import { GroupsGetMembersResponse } from 'vk-io/lib/api/schemas/responses';
import { stripIndents } from 'common-tags';

const log: Logger = new Logger('MessageMW');
const userRepository = getMongoRepository(User);

export class MessageMiddleware implements AbstractMiddleware {
  type = MiddlewareType.BEFORE;

  async middleware(
    context: MessageContext,
    next: NextMiddleware
  ): Promise<NextMiddlewareReturn> {
    if ((!context.text && !context.forwards) || context.senderId < 0)
      return next();

    const allText: string =
      (context.text || '') +
      '; ' +
      context.forwards
        ?.map((forward: MessageContext) => forward.text)
        .join('; ');

    const regex: RegExp = /http(?:s|):\/\/(?:\w+.|)tiktok.com\/[\w\d/@]+/gi;
    const matches: RegExpMatchArray | null = allText.match(regex);

    if (!matches || matches.length < 1) return next();

    await context.setActivity();

    let user: User | undefined = await userRepository.findOne({
      vkId: context.senderId
    });
    if (!user) {
      user = new User({ vkId: context.senderId });

      await userRepository.save(user);
    }
    if (user.rights < 0)
      return context.reply(stripIndents`
        ❗️ Пользователь @id${user.vkId} забанен
      `);

    const dons: GroupsGetMembersResponse = await vk.api.groups.getMembers({
      group_id: groupId.toString(),
      filter: 'donut'
    });

    const isDon: boolean = dons.items.some(
      (id: number) => id === context.senderId
    );

    if (Date.now() - user.lastSend < (isDon ? 30000 : 60000) && user.rights < 1)
      return context.reply(
        '⏰ Превышен лимит TikTok&#39;ов, попробуйте снова через минуту :3'
      );

    const attachment: VideoAttachment[] = [];

    let isErrorOccured: boolean = false;

    for (const url of isDon || user.rights >= 1
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
        const videoAttachment: VideoAttachment = await userVK.upload.video({
          source: {
            value: video.data
          },
          name: 'TikTok - ' + url
        });

        attachment.push(videoAttachment);
      } catch (e) {
        log.error(e);

        isErrorOccured = true;
      }
    }

    user.lastSend = Date.now();
    user.timestamps.push(Date.now());

    await userRepository.save(user);

    return context.reply(
      (!isDon
        ? '😊 Если ты ещё не подписан на наше сообщество, то сделай это, с нами весело!\n'
        : '') +
        ((user.rights < 1 && !isDon && matches.length > 1) ||
        (user.rights < 1 && isDon && matches.length > 5)
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
      { attachment }
    );
  }
}
