import {
  IResolvedOwnerResource,
  IResolvedTargetResource,
  resolveResource
} from 'vk-io';
import { getMongoRepository } from 'typeorm';
import { stripIndents } from 'common-tags';

import { AbstractCommand, Context } from '@/core';
import { vk } from '@/utils';
import { User } from '@/entities';

export class Ban implements AbstractCommand {
  userRepository = getMongoRepository(User);

  trigger = /^\/(раз|)бан( .*|)$/i;
  rights = 1;

  async handler(context: Context) {
    let vkId: number;

    const notFound = () =>
      context.send(stripIndents`
        ❗️ Указанный пользователь (${context.$match[2]}) не найден
      `);

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

    let user: User | undefined = await this.userRepository.findOne({
      vkId
    });
    if (!user) {
      user = new User({ vkId: context.senderId });

      await this.userRepository.save(user);
    }

    if (context.$match[1] === 'раз') {
      user.rights = 1;
      await this.userRepository.save(user);

      return context.send(stripIndents`
        🤙 Успешно разбанил пользователя @id${vkId}
      `);
    } else {
      user.rights = -1;
      await this.userRepository.save(user);

      return context.send(stripIndents`
        🤬 Успешно забанил пользователя @id${vkId}
      `);
    }
  }
}
