import { VK } from 'vk-io';
import { token, userToken, widgetToken } from '@/config';

export const vk = new VK({ token });
export const userVK = new VK({ token: userToken });
export const widgetVK = new VK({ token: widgetToken });
