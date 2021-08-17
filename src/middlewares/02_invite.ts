import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';
import { stripIndents } from 'common-tags';

import { Context, Middleware } from '@/core';
import { adminPeerId, groupId } from '@/config';
import { vk } from '@/utils';
import { UsersGetResponse } from 'vk-io/lib/api/schemas/responses';

/**
 * Не знаю, как накосячил Negezor, но updates.on('chat_invite_user', ...) не работает.
 * Выкручиваемся как можем
 */
export const inviteMiddleware = new Middleware({
  middleware: async (
    context: Context,
    next: NextMiddleware
  ): Promise<NextMiddlewareReturn | number> => {
    if (
      context.eventType !== 'chat_invite_user' ||
      context.eventMemberId !== -groupId
    )
      return next();

    await context.send(
      stripIndents`
        😊 Спасибо за приглашение в эту беседу!
        ⚙️ Чтобы я мог работать без упоминаний, выдайте мне право на чтение переписки или назначьте администратором.
  
        📚 Подробнее обо мне и моей настройке - https://vk.com/@tiktokbot-info
      `
    );

    const [user]: UsersGetResponse = await vk.api.users.get({
      user_ids: context.senderId.toString()
    });

    return vk.api.messages.send({
      peer_id: adminPeerId,
      message: stripIndents`
        🙃 Меня пригласили в беседу
        
        🤔 Пригласивший человек: [id${context.senderId}|${user.first_name} ${user.last_name}]
        🔢 PeerId беседы: ${context.peerId}
      `,
      random_id: 0
    });
  }
});
