import { schedule, ScheduledTask } from 'node-cron';
import { getMongoRepository, MongoRepository } from 'typeorm';

import { Logger, widgetVK } from '@/utils';
import { groupId } from '@/config';
import { TikTokVideo } from '@/entities';

const tiktokVideoRepository: MongoRepository<TikTokVideo> =
  getMongoRepository(TikTokVideo);
const log: Logger = new Logger('WidgetUpdater');

export const updateWidget = async () => {
  // eslint-disable-next-line
  log.info('Обновление виджета с топом TikTok\'ов...');

  const widgetData: Record<string, any> = {
    title: 'Топ TikTok&#39;ов среди пользователей бота',
    title_url: `https://vk.com/club${groupId}`,
    title_counter: 1,
    head: [
      {
        text: 'Описание',
        align: 'left'
      },
      {
        text: 'Ссылка',
        align: 'center'
      },
      {
        text: 'Запросов',
        align: 'right'
      }
    ],
    body: []
  };

  const tiktokVideos: TikTokVideo[] = await tiktokVideoRepository.find({
    take: 10,
    // Оказывается, что так можно... Напомню, что это массив
    order: { timestamps: 'DESC' }
  });

  widgetData.body = tiktokVideos.map((tiktokVideo: TikTokVideo) => [
    { icon_id: tiktokVideo.icon, text: tiktokVideo.description },
    { text: tiktokVideo.link },
    { text: tiktokVideo.timestamps.length }
  ]);

  try {
    await widgetVK.api.appWidgets.update({
      type: 'table',
      code: `return ${JSON.stringify(widgetData)};`
    });

    log.info('Виджет успешно обновлён');
  } catch (e) {
    log.error('Ошибка при обновлении виджета:', e);

    throw e;
  }
};

export default (): ScheduledTask =>
  schedule('0 0 * * *', updateWidget, { timezone: 'Europe/Moscow' });
