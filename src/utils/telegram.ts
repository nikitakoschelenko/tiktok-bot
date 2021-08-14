import { Telegram } from 'puregram';
import { telegramToken } from '@/config';

export const telegram: Telegram = new Telegram({ token: telegramToken });
