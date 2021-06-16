import { MessageContext, VK } from 'vk-io';
import { StepSceneContext } from '@vk-io/scenes';

import { Commander } from '@/core';

export interface Context extends MessageContext, StepSceneContext {
  core: {
    vk: VK;
    commander: Commander;
    options: {
      groupId: number;
    };
  };
}
