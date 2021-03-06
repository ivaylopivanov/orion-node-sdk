export class Request {

  public tracerData: {[key: string]: string[]} = {};
  public timeout: number;
  public meta: {[key: string]: string} = {};

  constructor(public path: string, public params?: any) {

  }

  public getId(): string {
    return this.meta['x-trace-id'];
  }

  public merge(req: Request) {
    this.meta = req.meta;
    this.tracerData = req.tracerData;
  }

}
