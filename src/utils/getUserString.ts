import { TelegramUser } from 'puregram/lib/telegram-interfaces';

export const getUserString = (user: TelegramUser): string =>
  `*${user.first_name + (user.last_name ? ' ' + user.last_name : '')}* ([@${
    user.username ?? 'id' + user.id
  }](${user.username ? '@' + user.username : 'tg://user?id=' + user.id}))`;
