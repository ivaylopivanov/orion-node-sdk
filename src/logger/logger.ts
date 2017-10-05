import * as graylog from 'graygelf';

import { RawMessage, Logger as LoggerInterface } from '../types/interfaces';

import { Message } from './message';

export class Logger implements LoggerInterface {

  private _client: any;

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
    this._client.raw(m);
  }

}
