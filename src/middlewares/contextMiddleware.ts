import { VK, Context } from 'vk-io';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Commander } from '@/core';

export function contextMiddleware({
  commander,
  vk,
  groupId
}: {
  commander: Commander;
  vk: VK;
  groupId: number;
}) {
  return (
    context: Context,
    next: NextMiddleware
  ): Promise<NextMiddlewareReturn> => {
    context.core = {
      commander,
      vk,
      options: {
        groupId
      }
    };

    return next();
  };
}
