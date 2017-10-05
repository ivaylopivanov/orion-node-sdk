import { OrionError } from '../error/error';

export class Response {

  constructor(public payload: any, public error?: OrionError) {

  }

}
