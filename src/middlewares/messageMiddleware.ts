import { getMongoRepository } from 'typeorm';
import axios, { AxiosResponse } from 'axios';
import { VideoAttachment } from 'vk-io';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Context } from '@/core';
import { axiosConfig } from '@/config';
import { Logger, userVK } from '@/utils';
import { User } from '@/entities';

const log = new Logger('MessageMW');
const userRepository = getMongoRepository(User);

export async function messageMiddleware(
  context: Context,
  next: NextMiddleware
): Promise<NextMiddlewareReturn> {
  if (!context.text || context.isFromGroup) return next();

  const regex: RegExp = /http(?:s|):\/\/(?:\w+.|)tiktok.com\/[\w\d/@]+/gi;
  const matches: RegExpMatchArray | null = context.text.match(regex);

  if (!matches || matches.length < 1) return next();

  let user: User | undefined = await userRepository.findOne({
    vkId: context.senderId
  });
  if (!user) {
    user = new User({ vkId: context.senderId });

    await userRepository.save(user);
  }

  if (Date.now() - user.lastSend < 60 * 1000)
    // eslint-disable-next-line prettier/prettier
    return context.reply('⏰ Превышен лимит TikTok\'ов, попробуйте снова через минуту :3');

  const attachment: VideoAttachment[] = [];

  let isErrorOccured: boolean = false;

  for (const url of matches.length > 5 ? matches.slice(0, 4) : matches) {
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
    (!context.isChat
      ? '😊 Вообще я предназначен для работы в беседе, но для тебя сделаю исключение :3'
      : '') +
      (isErrorOccured
        ? '🤬 Некоторые видео не были загружены из-за ошибки'
        : ''),
    { attachment }
  );
}
