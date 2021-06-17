import { sync } from 'glob';

import { Logger } from '@/utils';

type DefaultLoadedModule = { default: () => Promise<void> };

export const load = async (): Promise<void> => {
  const log: Logger = new Logger('Bootstrap');
  log.info(`Запуск...`);

  const raw: string[] = sync(__dirname + '/**/*.{js,ts}');
  const files: string[] = raw
    .sort()
    .filter(
      (filepath: string) =>
        !filepath.includes('index') && !filepath.includes('/_')
    );

  log.info(`Найдено ${files.length} модулей`);

  for (const filepath of files) {
    log.debug(`  - ${filepath.split('/').slice(-1)}...`);

    const module: DefaultLoadedModule = await import(filepath);
    await module.default();
  }

  log.info(`Успешный запуск`);
};
