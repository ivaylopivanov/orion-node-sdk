const UUID = require('uuid');

export class OrionError extends Error {

  public uuid = UUID.v4();
  public message;

  constructor(public code: string, message?: string) {
    super(message || code);
    // Delete this.message from original error. Hope this isn't breaking anything.
    delete this.message;
    this.message = message || code;
  }

}
