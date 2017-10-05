export class Request {

  public tracerData: {[key: string]: string[]} = {};
  public callTimeout: number;
  public meta: {[key: string]: string} = {};

  constructor(public path: string, public params?: any) {

  }

  public getId(): string {
    return this.meta['x-trace-id'];
  }

}
