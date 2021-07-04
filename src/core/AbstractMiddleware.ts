import { MessageContext } from 'vk-io';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

export enum MiddlewareType {
  BEFORE,
  AFTER
}

export abstract class AbstractMiddleware {
  public abstract type: MiddlewareType;

  constructor(options: Partial<AbstractMiddleware>) {
    Object.assign(this, options);
  }

  public abstract middleware(
    context: MessageContext,
    next: NextMiddleware
  ): Promise<NextMiddlewareReturn> | NextMiddlewareReturn | any;
}
