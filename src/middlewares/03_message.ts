import resizeImage from 'resize-image-buffer';
import axios, { AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { FormData, File } from 'formdata-node';
import { FormDataEncoder } from 'form-data-encoder';
import { getMongoRepository, MongoRepository } from 'typeorm';
import { MessageContext, VideoAttachment } from 'vk-io';
import {
  GroupsGetMembersResponse,
  AppWidgetsGetGroupImageUploadServerResponse
} from 'vk-io/lib/api/schemas/responses';
import { UtilsShortLink, AppWidgetsPhoto } from 'vk-io/lib/api/schemas/objects';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Context, Middleware } from '@/core';
import { TikTokVideo, User } from '@/entities';
import { Logger, userVK, vk, widgetVK } from '@/utils';
import { axiosConfig, groupId } from '@/config';

type VideoData = {
  link: string;
  avatarUrl: string;
  description: string;
};

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

    const videoDatas: VideoData[] = [];
    const attachment: VideoAttachment[] = [];

    let isErrorOccured: boolean = false;

    for (const url of isDon || context.user.rights >= 1
      ? matches.slice(0, 5)
      : matches.slice(0, 1)) {
      try {
        const res: AxiosResponse = await axios.get(url, axiosConfig);
        const html: string = res.data;

        const partDownloadUrl: string = html.split('"downloadAddr":"')[1];
        const rawDownloadUrl: string =
          partDownloadUrl.split('","shareCover":')[0];
        const downloadUrl: string = rawDownloadUrl.replace(/\\u0026/g, '&');

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

        const partAvatarUrl: string = html.split('"avatarThumb":"')[1];
        const rawAvatarUrl: string = partAvatarUrl.split('","signature":')[0];
        const avatarUrl: string = rawAvatarUrl.replace(/\\u0026/g, '&');

        const partDescription: string = html.split(
          '"metaParams":{"title":"'
        )[1];
        const description: string = partDescription.split('","keywords":')[0];

        // Разработчики axios, видимо, не знают, что query не входит в path
        videoDatas.push({
          link:
            'https://tiktok.com' + (res.request.path as string).split('?')[0],
          avatarUrl,
          description
        });
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

    for await (const videoData of videoDatas) {
      // Вроде норм регекс
      const matches: RegExpMatchArray | null = videoData.link.match(
        /\/(@.+)\/video\/(\d+)/
      );
      if (!matches || matches.length !== 3) continue;

      const options: Partial<TikTokVideo> = {
        author: matches[1],
        videoId: matches[2]
      };

      let tiktokVideo: TikTokVideo | undefined =
        await tiktokVideoRepository.findOne(options);
      if (!tiktokVideo) {
        let link: string | undefined;
        let icon: string | undefined;

        try {
          // Получаем сокращённую ссылку
          const { short_url }: UtilsShortLink = await vk.api.utils.getShortLink(
            {
              url: videoData.link
            }
          );

          link = short_url;
        } catch (e) {
          log.error('Ошибка при попытке получения короткой ссылки:', e);
        }

        try {
          // fuck you
          // Часть кода честно украдена с https://github.com/negezor/vk-io

          const imageRes: AxiosResponse = await axios.get(videoData.avatarUrl, {
            ...axiosConfig,
            responseType: 'arraybuffer'
          });
          const imageData: Buffer = imageRes.data;
          if (!imageData) return;

          const image: Buffer = await resizeImage(imageData, {
            format: 'jpg',
            width: 72,
            height: 72
          });

          const uploadServer: AppWidgetsGetGroupImageUploadServerResponse =
            await widgetVK.api.appWidgets.getGroupImageUploadServer({
              image_type: '24x24'
            });
          if (!uploadServer.upload_url) return;

          const formData: FormData = new FormData();
          formData.append(
            'image',
            new File([image], `${options.author}.jpg`, {
              type: 'image/jpeg'
            })
          );

          const encoder: FormDataEncoder = new FormDataEncoder(formData);
          const rawBody: Readable = Readable.from(encoder.encode());

          const uploadRes: AxiosResponse = await axios.post(
            uploadServer.upload_url,
            rawBody,
            {
              headers: encoder.headers
            }
          );
          if (!uploadRes.data) return;
          const photo: AppWidgetsPhoto =
            await widgetVK.api.appWidgets.saveGroupImage(uploadRes.data);

          icon = photo.id;
        } catch (e) {
          log.error('Ошибка при попытке загрузки аватара:', e);
        }

        tiktokVideo = new TikTokVideo({
          ...options,
          description:
            videoData.description.split('\n').join(' ').slice(0, 20) + '...',
          link,
          icon
        });
      }

      // Фикс Race Condition
      // @ts-ignore
      delete tiktokVideo.timestamps;
      await tiktokVideoRepository.findOneAndUpdate(
        options,
        {
          $set: tiktokVideo,
          $push: {
            timestamps: Date.now()
          }
        },
        { upsert: true }
      );
    }
  }
});
