import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Context } from '@/core';

export class Middleware {
  public middleware: (
    context: Context,
    next: NextMiddleware
  ) => Promise<NextMiddlewareReturn> | NextMiddlewareReturn | any;

  constructor(options: Partial<Middleware>) {
    Object.assign(this, options);
  }
}
