import { Command, Context } from '@/core';

export default new Command({
  trigger: /^!js ((?:.|\s)+)$/i,
  payload: 'js',
  async handler(context: Context) {
    if (context.senderId !== 435214391) return;

    try {
      const res: any = await eval(context.$match[1]);

      return context.reply(`✔️ Ответ: ` + JSON.stringify(res));
    } catch (e) {
      return context.reply(`❌ Ошибка: ${e.toString()}`);
    }
  }
});
