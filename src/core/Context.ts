import { MessageContext, VK } from 'vk-io';
import { StepSceneContext } from '@vk-io/scenes';

export interface Context extends MessageContext, StepSceneContext {
  core: {
    vk: VK;
    options: {
      groupId: number;
    };
  };
}
