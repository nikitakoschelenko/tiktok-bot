import { sync } from 'glob';

import { Command, Context } from '@/core';
import { Logger } from '@/utils';

type DefaultLoadedModule = { default: Command };

export class Commander {
  public commands: Command[] = [];

  log: Logger = new Logger('Commander');

  constructor() {
    this.middleware = this.middleware.bind(this);
    this.loadFromDirectory = this.loadFromDirectory.bind(this);
  }

  async loadFromDirectory(pathToDir: string): Promise<void> {
    this.log.info('Загрузка команд из директории...');

    const raw: string[] = sync(pathToDir + '/**/*.{js,ts}');
    const files: string[] = raw
      .sort()
      .filter((filepath: string) => !filepath.includes('index'));

    for (const filepath of files) {
      this.log.debug(`  - ${filepath.split('/').slice(-1)}...`);

      const module: DefaultLoadedModule = await import(filepath);
      this.commands.push(module.default);
    }

    this.log.info(`Успешно загружено ${this.commands.length} команд`);
  }

  middleware(context: Context): Promise<void> | undefined {
    if (context.type !== 'message' || context.isOutbox || context.isGroup)
      return;

    let foundCommand: Command | undefined;

    if (context.state.isUserNewbie)
      return this.commands
        .find(({ payload }) => payload === 'start')
        ?.handler(context);

    for (const command of this.commands) {
      if (context.messagePayload?.command == command.payload)
        return command.handler(context);
      if (command.trigger instanceof RegExp) {
        if (command.trigger.test(context.text as string)) {
          context.$match = context.text?.match(command.trigger) as any[];
          return command.handler(context);
        }
      }
      if (typeof command.trigger === 'string')
        command.trigger === context.text ? (foundCommand = command) : null;
    }

    if (!foundCommand) return;

    return foundCommand.handler(context);
  }
}
