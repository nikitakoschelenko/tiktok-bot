import { MessageContext } from 'vk-io';
import { NewChatMembersContext, User } from 'puregram';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';
import { stripIndents } from 'common-tags';

import { Context, Middleware } from '@/core';
import { vkPeerId, telegramChatId, vkGroupId } from '@/config';
import { getUserString, isVK, telegram, vk } from '@/utils';
import { UsersGetResponse } from 'vk-io/lib/api/schemas/responses';

/**
 * Не знаю, как накосячил Negezor, но updates.on('chat_invite_user', ...) не работает.
 * Выкручиваемся как можем
 */
export const inviteMiddleware = new Middleware({
  middleware: async (
    context: Context,
    next: NextMiddleware
  ): Promise<MessageContext | NextMiddlewareReturn> => {
    if (!context.senderId) return;

    if (isVK(context)) {
      if (
        context.eventType !== 'chat_invite_user' ||
        context.eventMemberId !== -vkGroupId
      )
        return next();
    } else if (
      !(context instanceof NewChatMembersContext) ||
      !context.eventMembers.some((em: User) => em.id === telegram.bot.id)
    )
      return next();

    await context.send(stripIndents`
      😊 Спасибо за приглашение в эту беседу!
      ⚙️ Чтобы я мог работать без упоминаний, выдайте мне право на чтение переписки или назначьте администратором.

      📚 Подробнее обо мне и моей настройке - https://vk.com/@tiktokbot-info
    `);

    if (isVK(context)) {
      const [vkUser]: UsersGetResponse = await vk.api.users.get({
        user_ids: context.senderId.toString()
      });

      return vk.api.messages.send({
        peer_id: vkPeerId,
        message: stripIndents`
          🙃 Меня пригласили в беседу
          
          🤔 Пригласивший человек: [id${context.senderId}|${vkUser.first_name} ${vkUser.last_name}]
          🔢 ID диалога: ${context.peerId}
        `,
        random_id: 0
      });
    } else {
      if (!context.from) return;

      return telegram.api.sendMessage({
        chat_id: telegramChatId,
        text: stripIndents`
          🙃 Меня пригласили в беседу
          
          🤔 Пригласивший человек: ${getUserString(context.from.toJSON())}
          🔢 ID чата: ${context.chatId}
        `,
        parse_mode: 'markdown'
      });
    }
  }
});
