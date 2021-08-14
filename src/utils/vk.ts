import { VK } from 'vk-io';
import { vkToken, vkUserToken } from '@/config';
import { Context, VKContext } from '@/core';

export const vk: VK = new VK({ token: vkToken });
export const userVK: VK = new VK({ token: vkUserToken });

export const isVK = (context: Context): context is VKContext => !context.from;
