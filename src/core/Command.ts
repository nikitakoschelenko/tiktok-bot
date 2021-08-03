import { Context } from '@/core';

export class Command {
  public trigger: RegExp;
  public id?: string;

  public handler: (context: Context) => any;

  constructor(options: Partial<Command>) {
    Object.assign(this, options);
  }
}
