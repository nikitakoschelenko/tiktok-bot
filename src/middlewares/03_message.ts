import { getMongoRepository, MongoRepository } from 'typeorm';
import axios, { AxiosResponse } from 'axios';
import { MessageContext, VideoAttachment } from 'vk-io';
import { GroupsGetMembersResponse } from 'vk-io/lib/api/schemas/responses';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Context, Middleware } from '@/core';
import { TikTokVideo, User } from '@/entities';
import { Logger, userVK, vk } from '@/utils';
import { axiosConfig, groupId } from '@/config';
import { UtilsShortLink } from 'vk-io/lib/api/schemas/objects';

const tiktokVideoRepository: MongoRepository<TikTokVideo> =
  getMongoRepository(TikTokVideo);
const userRepository: MongoRepository<User> = getMongoRepository(User);
const log: Logger = new Logger('MessageMW');

export const messageMiddleware = new Middleware({
  middleware: async (
    context: Context,
    next: NextMiddleware
  ): Promise<NextMiddlewareReturn> => {
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

    // В бане - игнорим
    if (context.user.rights < 0) return;

    const dons: GroupsGetMembersResponse = await vk.api.groups.getMembers({
      group_id: groupId.toString(),
      filter: 'donut'
    });

    const isDon: boolean = dons.items.some(
      (id: number) => id === context.senderId
    );

    if (
      Date.now() - context.user.lastSend < (isDon ? 30000 : 60000) &&
      context.user.rights < 1
    )
      return context.reply(
        '⏰ Превышен лимит TikTok&#39;ов, попробуйте снова через минуту :3'
      );

    const videoLinks: string[] = [];
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

        const videoAttachment: VideoAttachment = await userVK.upload.video({
          source: {
            value: video.data
          },
          name: 'TikTok - ' + url
        });
        attachment.push(videoAttachment);

        // Делаем в конце, а то мало ли ссылка инвалид
        videoLinks.push('https://tiktok.com' + res.request.path);
      } catch (e) {
        log.error(e);

        isErrorOccured = true;
      }
    }

    // Дико, но работает
    // Менять на if'ы не собираюсь, мне так норм
    await context.reply(
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
      { attachment }
    );

    // О - оптимизация
    // Все остальное делаем после выдачи ответа

    context.user.lastSend = Date.now();
    context.user.timestamps.push(context.user.lastSend);
    await userRepository.save(context.user);

    for await (const videoLink of videoLinks) {
      // Получаем сокращённую ссылку
      const { short_url }: UtilsShortLink = await vk.api.utils
        .getShortLink({
          url: videoLink
        })
        .catch(() => ({}));

      // Вроде норм регекс
      const matches: RegExpMatchArray | null = videoLink.match(
        /\/(@.+)\/video\/(\d+)/
      );
      if (!matches || matches.length !== 3) continue;

      const options: Partial<TikTokVideo> = {
        author: matches[1],
        videoId: matches[2],
        link: short_url || videoLink
      };

      let tiktokVideo: TikTokVideo | undefined =
        await tiktokVideoRepository.findOne(options);
      if (!tiktokVideo) tiktokVideo = new TikTokVideo(options);

      tiktokVideo.timestamps.push(Date.now());
      await tiktokVideoRepository.save(tiktokVideo);
    }
  }
});
