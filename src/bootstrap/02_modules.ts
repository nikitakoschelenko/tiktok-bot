import { sync } from 'glob';

import { Logger } from '@/utils';

type DefaultLoadedModule = { default: () => Promise<any> };

const log: Logger = new Logger('Modules');

export default async function modulesLoader(): Promise<void> {
  log.info('Загрузка дополнительных модулей...');

  const raw: string[] = sync(__dirname + '/../modules/**/*.{js,ts}');
  const files: string[] = raw
    .sort()
    .filter(
      (filepath: string) =>
        !filepath.includes('index') && !filepath.includes('/_')
    );

  try {
    for await (const filepath of files) {
      log.debug(`  - ${filepath.split('/').slice(-1)}...`);

      const module: DefaultLoadedModule = await import(filepath);
      await module.default();
    }
  } catch (e) {
    log.error('Ошибка при загрузке дополнительных модулей:', e);
  }

  log.info('Дополнительные модули успешно загружены');
}
