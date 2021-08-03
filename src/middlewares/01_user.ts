import { getMongoRepository, MongoRepository } from 'typeorm';
import { NextMiddleware, NextMiddlewareReturn } from 'middleware-io';

import { Context, Middleware } from '@/core';
import { User } from '@/entities';

const userRepository: MongoRepository<User> = getMongoRepository(User);

export const user = new Middleware({
  middleware: async (
    context: Context,
    next: NextMiddleware
  ): Promise<NextMiddlewareReturn> => {
    let user: User | undefined = await userRepository.findOne({
      vkId: context.senderId
    });
    if (!user) {
      user = new User({ vkId: context.senderId });

      await userRepository.save(user);
    }

    context.user = user;

    return next();
  }
});
