import { Context } from '@/core/Context';

export class Command {
  trigger?: RegExp | string;
  payload?: string;
  description: string;
  usage?: string;
  handler: (context: Context) => any;

  constructor(options: Partial<Command>) {
    Object.assign(this, options);
  }
}
