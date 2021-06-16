import { MessageContext } from 'vk-io';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Context } from '@/core';
import { stripIndents } from 'common-tags';

export function inviteMiddleware(
  context: Context,
  next: NextMiddleware
): Promise<MessageContext> | NextMiddlewareReturn {
  if (context.eventType !== 'chat_invite_user') return next();

  return context.send(
    stripIndents`
      😊 Спасибо за приглашение в эту беседу!
      ⚙️ Чтобы я мог работать, выдайте мне право на чтение переписки или назначьте администратором.

      ℹ️ Подробнее обо мне и моей настройке - https://vk.com/@tiktokbot1-info`
  );
}
