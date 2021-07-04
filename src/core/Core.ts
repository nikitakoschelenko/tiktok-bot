import { MessageContext } from 'vk-io';
import { getMongoRepository } from 'typeorm';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';
import { sync } from 'glob';

import { AbstractCommand, AbstractMiddleware, MiddlewareType } from '@/core';
import { Logger } from '@/utils';
import { User } from '@/entities';

type LoadedModule<T> = Record<string, T>;
type LoadedCommand = LoadedModule<Command>;
type LoadedMiddleware = LoadedModule<Middleware>;

type Command = new () => AbstractCommand;
type Middleware = new () => AbstractMiddleware;

export class Core {
  log: Logger = new Logger('Core');
  userRepository = getMongoRepository(User);

  public commands: Command[] = [];
  public middlewares: Middleware[] = [];

  constructor() {
    this.middleware = this.middleware.bind(this);
    this.loadCommands = this.loadCommands.bind(this);
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

  public async loadCommands(path: string): Promise<void> {
    this.log.info('Загрузка команд из директории...');

    for (const module of await this.loadFromDir<LoadedCommand>(path))
      this.commands = this.commands.concat(Object.values(module));

    this.log.info(`Успешно загружено ${this.commands.length} команд`);
  }

  public async loadMiddlewares(path: string): Promise<void> {
    this.log.info('Загрузка обработчиков из директории...');

    for (const module of await this.loadFromDir<LoadedMiddleware>(path))
      this.middlewares = this.middlewares.concat(Object.values(module));

    this.log.info(`Успешно загружено ${this.commands.length} обработчиков`);
  }

  public getMiddlewares(type: MiddlewareType): Middleware[] {
    return this.middlewares.filter(
      (middleware: Middleware) => new middleware().type === type
    );
  }

  public async middleware(
    context: MessageContext,
    next: NextMiddleware
  ): Promise<NextMiddlewareReturn | void | undefined> {
    if (context.type !== 'message' || context.isOutbox || context.isGroup)
      return;

    if (context.state.isUserNewbie) {
      const command: Command | undefined = this.commands.find(
        (command: Command) => new command().payload === 'start'
      );

      if (command) return new command().handler(context);
    }

    for (const commandClass of this.commands) {
      const command: AbstractCommand = new commandClass();

      const user: User | undefined = await this.userRepository.findOne({
        vkId: context.senderId
      });

      const rights: boolean | undefined =
        !command.rights || (user && user.rights >= command.rights);

      if (
        command.payload &&
        context.messagePayload?.command === command.payload &&
        rights
      )
        return command.handler(context);

      if (context.text && command.trigger.test(context.text) && rights) {
        context.$match = context.text.match(command.trigger) || [];

        return command.handler(context);
      }
    }

    return next();
  }
}
