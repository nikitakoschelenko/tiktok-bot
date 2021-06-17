import { Context } from '@/core';

export abstract class AbstractCommand {
  public abstract trigger: RegExp;

  public payload?: string;
  public description?: string;
  public usage?: string;

  constructor(options: Partial<AbstractCommand>) {
    Object.assign(this, options);
  }

  public abstract handler(context: Context): any;
}
