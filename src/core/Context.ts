import { MessageContext } from 'vk-io';
import { ISessionContext } from '@vk-io/session';

import { Core } from '@/core';
import { User } from '@/entities';

export type Context = MessageContext &
  ISessionContext & {
    core: Core;
    user: User;
  };
