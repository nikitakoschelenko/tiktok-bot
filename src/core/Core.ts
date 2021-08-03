import { VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SessionManager } from '@vk-io/session';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';
import { sync } from 'glob';

import { Context, Command, Middleware } from '@/core';
import { Logger } from '@/utils';

type LoadedModule<T> = Record<string, T>;
type Options = {
  middlewares: string;
  commands: string;
};

export class Core {
  private log: Logger = new Logger('Core');

  public vk: VK;
  public options: Options;

  public hearManager: HearManager<Context> = new HearManager();
  public sessionManager: SessionManager<Context> = new SessionManager();

  public commands: Command[] = [];
  public middlewares: Middleware[] = [];

  constructor(vk: VK, options: Options) {
    this.vk = vk;
    this.options = options;
  }

  private async loadFromDir<T>(path: string): Promise<T[]> {
    const modules: T[] = [];

    const raw: string[] = sync(path + '/**/*.{js,ts}');
    const files: string[] = raw
      .sort()
      .filter(
        (filepath: string) =>
          !filepath.includes('index') && !filepath.includes('/_')
      );

    for (const filepath of files) {
      this.log.debug(`  - ${filepath.split('/').slice(-1)}...`);

      const module: T = await import(filepath);
      modules.push(module);
    }

    return modules;
  }

  public runCommand(context: Context, id: string): any {
    const foundCommand: Command | undefined = this.commands.find(
      (command: Command) => command.id === id
    );

    if (foundCommand) return foundCommand.handler(context);
  }

  public async loadMiddlewares(): Promise<void> {
    this.log.info('Загрузка обработчиков из директории...');

    for (const module of await this.loadFromDir<LoadedModule<Middleware>>(
      this.options.middlewares
    ))
      this.middlewares = this.middlewares.concat(Object.values(module));

    this.log.info(`Успешно загружено ${this.middlewares.length} обработчиков`);
  }

  public async loadCommands(): Promise<void> {
    this.log.info('Загрузка команд из директории...');

    for (const module of await this.loadFromDir<LoadedModule<Command>>(
      this.options.commands
    ))
      this.commands = this.commands.concat(Object.values(module));

    this.log.info(`Успешно загружено ${this.commands.length} команд`);
  }

  // Не особо нравится, но другого не придумал
  public load(): Promise<void> {
    return this.loadMiddlewares().then(() => this.loadCommands());
  }

  public start(): Promise<void> {
    this.vk.updates.on(
      'message',
      (context: Context, next: NextMiddleware): NextMiddlewareReturn => {
        context.core = this;

        return next();
      }
    );

    this.vk.updates.on('message', this.sessionManager.middleware);

    for (const middleware of this.middlewares)
      this.vk.updates.use(middleware.middleware);

    this.vk.updates.on('message', this.hearManager.middleware);

    for (const command of this.commands)
      this.hearManager.hear(command.trigger, command.handler);

    return this.vk.updates.start();
  }
}
