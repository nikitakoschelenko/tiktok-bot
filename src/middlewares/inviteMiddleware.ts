import { MessageContext } from 'vk-io';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';
import { stripIndents } from 'common-tags';

import { AbstractMiddleware, MiddlewareType } from '@/core';
import { groupId } from '@/config';

export class InviteMiddleware implements AbstractMiddleware {
  type = MiddlewareType.BEFORE;

  middleware(
    context: MessageContext,
    next: NextMiddleware
  ): Promise<MessageContext> | NextMiddlewareReturn {
    if (
      context.eventType !== 'chat_invite_user' ||
      context.eventMemberId !== -groupId
    )
      return next();

    return context.send(
      stripIndents`
      😊 Спасибо за приглашение в эту беседу!
      ⚙️ Чтобы я мог работать, выдайте мне право на чтение переписки или назначьте администратором.

      📚 Подробнее обо мне и моей настройке - https://vk.com/@tiktokbot1-info`
    );
  }
}
