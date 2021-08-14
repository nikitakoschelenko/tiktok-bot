import { MessageContext as VKMessageContext } from 'vk-io';
import { MessageContext as TelegramMessageContext } from 'puregram';
import { ISessionContext as VKSessionContext } from '@vk-io/session';
import { SessionContext as TelegramSessionContext } from '@puregram/session';

import { Core } from '@/core';
import { User } from '@/entities';

export type BaseContext = {
  core: Core;
  user: User;
};
export type VKContext = VKMessageContext & VKSessionContext & BaseContext;
export type TelegramContext = TelegramMessageContext &
  TelegramSessionContext &
  BaseContext;
export type Context = VKContext | TelegramContext;

/* export class Context {
  public core: Core;
  public user: User;

  public type: 'vk' | 'telegram';
  public vkContext: VKMessageContext | undefined;
  public telegramContext: TelegramMessageContext | undefined;

  constructor(vkContext: VKMessageContext, telegramContext: undefined);
  constructor(vkContext: undefined, telegramContext: TelegramMessageContext);
  constructor(
    vkContext: VKMessageContext | undefined,
    telegramContext: TelegramMessageContext | undefined
  ) {
    if (vkContext) this.type = 'vk';
    else if (telegramContext) this.type = 'telegram';

    this.vkContext = vkContext;
    this.telegramContext = telegramContext;
  }

  public async send(text: string): Promise<Context | void> {
    if (this.type === 'vk' && this.vkContext)
      return new Context(await this.vkContext.send(text), undefined);
    else if (this.type === 'telegram' && this.telegramContext)
      return new Context(undefined, await this.telegramContext.send(text));
  }
} */
