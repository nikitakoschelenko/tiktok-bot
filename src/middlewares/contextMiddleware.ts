import { MessageContext } from 'vk-io';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { AbstractMiddleware, MiddlewareType } from '@/core';
import { vk } from '@/utils';
import { groupId } from '@/config';

export class ContextMiddleware implements AbstractMiddleware {
  type = MiddlewareType.BEFORE;

  middleware(
    context: MessageContext,
    next: NextMiddleware
  ): NextMiddlewareReturn {
    context.core = {
      vk,
      options: {
        groupId
      }
    };

    return next();
  }
}
