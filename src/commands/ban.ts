import { getMongoRepository, MongoRepository } from 'typeorm';
import {
  IResolvedOwnerResource,
  IResolvedTargetResource,
  resolveResource
} from 'vk-io';

import { Command, Context } from '@/core';
import { vk } from '@/utils';
import { User } from '@/entities';

const userRepository: MongoRepository<User> = getMongoRepository(User);

export const banCommand = new Command({
  trigger: /^\/(раз|)бан( .*|)$/i,
  handler: async (context: Context) => {
    // Недостаточно прав - игнорим
    if (context.user.rights < 1) return;

    let vkId: number;

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

      vkId = resource.id;
    } else if (context.replyMessage) {
      vkId = context.replyMessage.senderId;
    } else return notFound();

    if (context.$match[1] === 'раз') {
      context.user.rights = 1;
      await userRepository.save(context.user);

      return context.send(`🤙 Успешно разбанил пользователя @id${vkId}`);
    } else {
      context.user.rights = -1;
      await userRepository.save(context.user);

      return context.send(`🤬 Успешно забанил пользователя @id${vkId}`);
    }
  }
});
