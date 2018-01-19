import * as graylog from 'graygelf';

import { RawMessage, Logger as LoggerInterface } from '../types/interfaces';

import { Message } from './message';
import * as Colors from './colors';
import * as LoggerLevels from './levels';
import { ERROR } from './levels';

const KiB = 1024;
const MAXIMUM_PARAMS_SIZE = 30 * KiB; // Let the 2KiB to 32KiB free for other fields.

export class Logger implements LoggerInterface {

  private _client: any;
  private _verbose = process.argv.indexOf('--verbose') !== -1;

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
    if (this._verbose) {
      this._consoleLog(m);
    }
    try {
      const params = JSON.stringify(m.params) || '';
      if (params.length > MAXIMUM_PARAMS_SIZE) {
        m.params = params.substr(0, 4 * KiB) + '...';
        this._client.info(new Error(`HUGE PARAMETER SIZE (${params.length})`));
      } else {
        m.params = params;
      }
      this._client.raw(m);
    } catch (e) {
      this._client.info(e);
      this._client.raw(Object.assign({}, m, {
        level: ERROR,
        params: undefined,
      }));
    }
  }

  private _consoleLog(m: RawMessage) {
    const COLOR = Colors.getColorForLevel(m.level);
    const LEVEL = LoggerLevels.levelToString(m.level);
    const TIME = this._getTime();
    console.log('\x1b[' + COLOR + ';m ' + TIME + ' ▶', '\x1b[0m', LEVEL, JSON.stringify(m));
  }

  private _getTime(): string {
    const TODAY = new Date();

    let hours: any = TODAY.getHours();
    if (hours < 10) {
      hours = '0' + hours;
    }

    let minutes: any = TODAY.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    let seconds: any = TODAY.getSeconds();
    if (seconds < 10) {
      seconds = '0' + seconds;
    }

    let milliseconds: any = TODAY.getMilliseconds();
    if (milliseconds < 10) {
      milliseconds = '0' + milliseconds;
    }
    if (milliseconds < 99) {
      milliseconds = '0' + milliseconds;
    }

    return hours + ':' + minutes + ':' + seconds + ':' + milliseconds;
  }

}
