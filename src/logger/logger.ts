import * as graylog from 'graygelf';

import { RawMessage, Logger as LoggerInterface } from '../types/interfaces';

import { Message } from './message';
import * as Colors from './colors';
import * as LoggerLevels from './levels';

export class Logger implements LoggerInterface {

  private _client: any;
  private _vernose = process.argv.indexOf('--verbose') !== 0;

  constructor(private _serviceName: string) {
    this._client = new graylog({
      host: process.env.ORION_LOGGER_HOST || '127.0.0.1',
      port: process.env.ORION_LOGGER_PORT || 12201,
    });
  }

  public createMessage(message: string): Message {
    return new Message(this, this._serviceName, message);
  }

  public send(m: RawMessage) {
    if (this._vernose) {
      this._consoleLog(m);
    }
    this._client.raw(m);
  }

  private _consoleLog(m: RawMessage) {
    const COLOR = Colors.getColorForLevel(m.level);
    const LEVEL = LoggerLevels.levelToString(m.level);
    const TIME = this._getTime();
    console.log('\x1b[' + COLOR + ';m ' + TIME + ' ▶', '\x1b[0m', LEVEL, JSON.stringify(m));
  }

  private _getTime(): string {
    const TODAY = new Date();
    const HOURS = TODAY.getHours();
    const MINUTES = TODAY.getMinutes();
    const SECONDS = TODAY.getSeconds();
    const MILISECONDS = TODAY.getMilliseconds();
    return HOURS + ':' + MINUTES + ':' + SECONDS + ':' + MILISECONDS;
  }

}
