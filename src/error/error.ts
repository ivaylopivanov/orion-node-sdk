const UUID = require('uuid');

export class OrionError {

  public uuid = UUID.v4();

  constructor(public code: string, public message?: string) {

  }

}
