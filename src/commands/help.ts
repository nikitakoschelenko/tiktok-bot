import { stripIndents } from 'common-tags';

import { Command, Context } from '@/core';

export default new Command({
  trigger: /^!помощь|!начать|начать$/i,
  payload: 'start',
  description: 'Помощь по всем командам',
  async handler(context: Context) {
    const commands: string = context.core.commander.commands
      .filter((command: Command) => command.usage && command.description)
      .map(
        (command: Command) => stripIndents`
        📎 Команда: ${command.usage}
        📖 Описание: ${command.description}
      `
      )
      .join('\n\n');

    return context.send(stripIndents`
      ℹ️ Помощь по командам бота
      📌 Справка: [аргумент] - необязательный аргумент, <аргумент> - обязательный аргумент
      
      ${commands}
    `);
  }
});
