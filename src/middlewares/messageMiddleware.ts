import axios, { AxiosResponse } from 'axios';
import { VideoAttachment } from 'vk-io';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Context } from '@/core';
import { axiosConfig } from '@/config';
import { Logger, userVK } from '@/utils';

const log = new Logger('MessageMW');

export async function messageMiddleware(
  context: Context,
  next: NextMiddleware
): Promise<NextMiddlewareReturn> {
  if (!context.text) return next();

  const regex: RegExp = /http(?:s|):\/\/(?:\w+.|)tiktok.com\/[\w\d/@]+/gi;
  const matches: RegExpMatchArray | null = context.text.match(regex);

  if (!matches || matches.length < 1) return next();

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

  return context.reply(
    (!context.isChat ? '😊 Я предназначен для работы в беседе' : '') +
      (isErrorOccured
        ? '🤬 Некоторые видео не были загружены из-за ошибки'
        : ''),
    { attachment }
  );
}
