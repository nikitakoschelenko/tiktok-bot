import { getMongoRepository, MongoRepository } from 'typeorm';
import { stripIndents } from 'common-tags';

import { Command, Context } from '@/core';
import { TikTokVideo } from '@/entities';
import { pluralize } from '@/utils/pluralize';

const tiktokVideoRepository: MongoRepository<TikTokVideo> =
  getMongoRepository(TikTokVideo);

export const statisticCommand = new Command({
  trigger: /^\/stats|\/top|\/стата|\/статистика|\/топ$/i,
  handler: async (context: Context) => {
    // База не умеет сортировать по количеству элементов в массиве, поэтому ручками
    const tiktokVideos: TikTokVideo[] = await tiktokVideoRepository.find({});
    const top: string[] = tiktokVideos
      .slice(0, 10)
      .sort(
        (a: TikTokVideo, b: TikTokVideo) =>
          b.timestamps.length - a.timestamps.length
      )
      .map(
        (tiktokVideo: TikTokVideo, index: number) =>
          `${index + 1}. ${tiktokVideo.description} - ${
            tiktokVideo.timestamps.length
          } ${pluralize(tiktokVideo.timestamps.length, [
            'запрос',
            'запроса',
            'запросов'
          ])}, ${tiktokVideo.link}`
      );

    return context.reply(stripIndents`
      🎮 Статистика
      Отправлено: ${context.user.timestamps.length} видео

      ${top.length > 0 ? '✨ Топ' : ''}
      ${top.join('\n')}
    `);
  }
});
