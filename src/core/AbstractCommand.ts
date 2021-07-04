import { MessageContext } from 'vk-io';
import { Context } from '@/core';

export abstract class AbstractCommand {
  public abstract trigger: RegExp;

  public payload?: string;
  public rights?: number;

  constructor(options: Partial<AbstractCommand>) {
    Object.assign(this, options);
  }

  public abstract handler(context: MessageContext | Context): any;
}
