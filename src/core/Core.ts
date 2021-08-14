import { VK, MessageContext as VKMessageContext } from 'vk-io';
import { Telegram, MessageContext as TelegramMessageContext } from 'puregram';
import { HearManager as VKHearManager } from '@vk-io/hear';
import { SessionManager as VKSessionManager } from '@vk-io/session';
import { HearManager as TelegramHearManager } from '@puregram/hear';
import { SessionManager as TelegramSessionManager } from '@puregram/session';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';
import { sync } from 'glob';

import {
  VKContext,
  TelegramContext,
  Context,
  Command,
  Middleware
} from '@/core';
import { Logger } from '@/utils';

type LoadedModule<T> = Record<string, T>;

export class Core {
  private log: Logger = new Logger('Core');

  public vk: VK;
  public telegram: Telegram;

  public vkHearManager: VKHearManager<VKMessageContext> = new VKHearManager();
  public vkSessionManager: VKSessionManager<VKMessageContext> =
    new VKSessionManager();
  public telegramHearManager: TelegramHearManager<TelegramMessageContext> =
    new TelegramHearManager();
  public telegramSessionManager: TelegramSessionManager<TelegramMessageContext> =
    new TelegramSessionManager();

  public middlewaresPath: string;
  public commandsPath: string;

  public commands: Command[] = [];
  public middlewares: Middleware[] = [];

  constructor(options: Partial<Core>) {
    Object.assign(this, options);
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
      this.middlewaresPath
    ))
      this.middlewares = this.middlewares.concat(Object.values(module));

    this.log.info(`Успешно загружено ${this.middlewares.length} обработчиков`);
  }

  public async loadCommands(): Promise<void> {
    this.log.info('Загрузка команд из директории...');

    for (const module of await this.loadFromDir<LoadedModule<Command>>(
      this.commandsPath
    ))
      this.commands = this.commands.concat(Object.values(module));

    this.log.info(`Успешно загружено ${this.commands.length} команд`);
  }

  // Не особо нравится, но другого не придумал
  public load(): Promise<void> {
    return this.loadMiddlewares().then(() => this.loadCommands());
  }

  public startVK(): Promise<void> {
    this.vk.updates.on(
      'message',
      (context: VKContext, next: NextMiddleware): NextMiddlewareReturn => {
        context.core = this;

        return next();
      }
    );

    this.vk.updates.on('message', this.vkSessionManager.middleware);

    for (const middleware of this.middlewares)
      this.vk.updates.use(middleware.middleware);

    this.vk.updates.on('message', this.vkHearManager.middleware);

    for (const command of this.commands)
      this.vkHearManager.hear(command.trigger, command.handler);

    return this.vk.updates.start();
  }

  public startTelegram(): Promise<void> {
    this.telegram.updates.on(
      'message',
      (
        context: TelegramContext,
        next: NextMiddleware
      ): NextMiddlewareReturn => {
        context.core = this;

        return next();
      }
    );

    this.telegram.updates.on('message', this.telegramSessionManager.middleware);

    for (const middleware of this.middlewares)
      this.telegram.updates.use(middleware.middleware);

    this.telegram.updates.on('message', this.telegramHearManager.middleware);

    for (const command of this.commands)
      this.telegramHearManager.hear(command.trigger, command.handler);

    return this.telegram.updates.startPolling();
  }
}
