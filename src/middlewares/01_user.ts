import { getMongoRepository, MongoRepository } from 'typeorm';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Context, Middleware } from '@/core';
import { User, UserType } from '@/entities';
import { isVK } from '@/utils';

const userRepository: MongoRepository<User> = getMongoRepository(User);

export const user = new Middleware({
  middleware: async (
    context: Context,
    next: NextMiddleware
  ): Promise<NextMiddlewareReturn> => {
    if (!context.senderId) return;

    const type: UserType = isVK(context) ? UserType.VK : UserType.TELEGRAM;

    let user: User | undefined = await userRepository.findOne({
      id: context.senderId,
      type
    });
    if (!user) {
      user = new User({ id: context.senderId, type });

      await userRepository.save(user);
    }

    context.user = user;

    return next();
  }
});
