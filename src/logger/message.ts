import { Logger, Message as MessageInterface } from '../types/interfaces';

export class Message implements MessageInterface {

  private _id: string;
  private _level: number;
  private _params: any;

  constructor(private _client: Logger,
              private _host: string,
              private _message: string) {
  }

  public setLevel(level: number): this {
    this._level = level;
    return this;
  }

  public setId(id: string): this {
    this._id = id;
    return this;
  }

  public setParams(params: any): this {
    this._params = params;
    return this;
  }

  public send() {
    let m: any = {
      host: this._host,
      timestamp: Math.round(new Date().getTime() / 1000),
      message: this._message,
    };
    if (this._level !== undefined) {
      m.level = this._level;
    }
    if (this._params !== undefined) {
      m.params = this._params;
    }
    if (this._id !== undefined) {
      m['x-trace-id'] = this._id;
    }
    this._client.send(m);
  }

}
