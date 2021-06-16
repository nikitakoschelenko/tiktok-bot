import { VK } from 'vk-io';
import { token, userToken } from '@/config';

export const vk = new VK({ token });
export const userVK = new VK({ token: userToken });
