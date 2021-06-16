import { Logger as TsedLogger } from '@tsed/logger';

export class Logger extends TsedLogger {
  constructor(name: string) {
    super(name);

    this.appenders
      .set('std-log', {
        type: 'stdout',
        levels: ['debug', 'info', 'trace'],
        layout: { type: 'colored' }
      })
      .set('error-log', {
        type: 'stderr',
        levels: ['fatal', 'error', 'warn'],
        layout: { type: 'colored' }
      });
  }
}
