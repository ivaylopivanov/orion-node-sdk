const UUID = require('uuid');

export class OrionError extends Error {

  public uuid = UUID.v4();
  public message;

  constructor(public code: string, message?: string) {
    super(message || code);
    this.message = message || code;
  }

}
