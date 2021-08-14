import { getMongoRepository, MongoRepository } from 'typeorm';
import {
  IResolvedOwnerResource,
  IResolvedTargetResource,
  resolveResource
} from 'vk-io';

import { Command, Context } from '@/core';
import { isVK, vk } from '@/utils';
import { User } from '@/entities';

const userRepository: MongoRepository<User> = getMongoRepository(User);

export const banCommand = new Command({
  trigger: /^\/(раз|)бан( .*|)$/i,
  handler: async (context: Context) => {
    // Недостаточно прав - игнорим
    if (context.user.rights < 1) return;

    let id: number;

    const notFound = () =>
      context.send(
        '❗️ Указанный пользователь (${context.$match[2]}) не найден'
      );

    if (context.$match[2]) {
      const resource:
        | IResolvedTargetResource
        | IResolvedOwnerResource
        | undefined = await resolveResource({
        api: vk.api,
        resource: context.$match[2]
      });
      if (!resource || resource.type !== 'user') return notFound();

      id = resource.id;
    } else if (context.replyMessage && isVK(context)) {
      id = context.replyMessage.senderId;
    } else if (context.replyMessage && context.replyMessage.from?.id) {
      id = context.replyMessage.from.id;
    } else return notFound();

    const user: string = isVK(context)
      ? `@id${context.senderId}`
      : `[@id${id}](tg://user?id=${id})`;
    const options: Record<string, any> = isVK(context)
      ? {}
      : { parse_mode: 'markdown' };

    if (context.$match[1] === 'раз') {
      context.user.rights = 1;
      await userRepository.save(context.user);

      return context.send(`🤙 Успешно разбанил пользователя ${user}`, options);
    } else {
      context.user.rights = -1;
      await userRepository.save(context.user);

      return context.send(`🤬 Успешно забанил пользователя ${user}`, options);
    }
  }
});
