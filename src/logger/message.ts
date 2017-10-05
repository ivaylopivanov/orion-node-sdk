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
    this._client.send({
      level: this._level,
      host: this._host,
      params: this._params,
      message: this._message,
      'x-trace-id': this._id,
      timestamp: Math.round(new Date().getTime() / 1000),
    });
  }

}
