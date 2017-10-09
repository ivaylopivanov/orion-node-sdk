import { Codec, Transport, Tracer, Options, Logger } from '../types/interfaces';
import { DefaultBinaryCodec as DefaultCodec } from '../codec';
import { DefaultTransport } from '../transport';
import { Tracer as DefatulTracer } from '../tracer/tracer';
import { Logger as DefaultLogger } from '../logger/logger';
import { Request } from '../request/request';
import { Response } from '../response/response';
import { OrionError } from '../error/error';
import { generateId, debugLog } from '../utils';

function noop() {}

const DEBUG = debugLog('orion:service');

/**
 * Provides an interface to create your service and register request handlers.
 */
export class Service {

  public id: string = generateId();

  public logger: Logger;
  private _codec: Codec;
  private _transport: Transport;
  private _tracer: Tracer;

  /**
   * Create new service.
   */
  constructor(public name: string, protected options: Options = {}) {
    this.options = Object.assign({
      callTimeout: 200
    }, options);
    this._codec = this.options.codec || new DefaultCodec();
    this._transport = this.options.transport || new DefaultTransport();
    this._tracer = this.options.tracer || new DefatulTracer(name);
    this.logger = this.options.logger || new DefaultLogger(name);
  }

  /**
   * Subscribe to a topic.
   * @param {string} topic
   * @param {Function} callback
   */
  public on(topic: string, callback: Function, disableGroup: boolean = false) {
    const SUBJECT = `${this.name}:${topic}`;
    DEBUG('on:', SUBJECT);
    return this._transport.subscribe(SUBJECT, disableGroup ? null : this.name, message => {
      callback(this._codec.decode(message));
    });
  }



  /**
   * Register request handler method with enabled logging.
   * @param {string} method
   * @param {Function} callback
   * @param {string} [prefix]
   */
  public handle(path: string, callback: Function, prefix?: string) {
    const LOGGING = true;
    this._handle(path, callback, LOGGING, prefix);
  }

  /**
   * Register request handler method with disabled logging.
   * @param {string} method
   * @param {Function} callback
   * @param {string} [prefix]
   */
  public handleWithoutLogging(path: string, callback: Function, prefix?: string) {
    const LOGGING = false;
    this._handle(path, callback, LOGGING, prefix);
  }

  /**
   * Start listenning on the underlying transport connection.
   * @param {Function} callback
   */
  public listen(callback: Function) {
    DEBUG('listen');
    this._transport.listen(callback);
  }

  /**
   * Close underlying transport connection.
   */
  public close() {
    DEBUG('close');
    this._transport.close();
  }

  /**
   * Service name and id.
   */
  public toString() {
    return `${this.name}-${this.id}`;
  }

  /**
   * Publish to a topic.
   * @param {any} topic
   * @param {Object} message
   */
  public emit(topic: string, message: any) {
    DEBUG('emit:', topic);
    this._transport.publish(topic, this._codec.encode(message));
  }

  /**
   * Call service method.
   * @param {Object} request
   * @param {Object} [params]
   * @param {Function} callback
   */
  public call(req: any, callback?: Function) {
    if (req instanceof Request === false) {
      throw new Error('Request must be instance of Orion.Request');
    }
    if (!callback) {
      callback = function () { };
    }
    this._serializeRequest(req, callback);
  }

  public getCallTimeout(path: string, timeout: number) {
    let options = this.options;
    let specificCallTimeout =
      options.callTimeouts && options.callTimeouts[path];

    return timeout || specificCallTimeout || options.callTimeout;
  }

  private _call(route: string, req: Request, callback: Function) {
    const CLOSE_TRACER = this._tracer.trace(req);

    this._transport.request(route, this._codec.encode(req), res => {
      // handle transport error
      if (res instanceof Error) {
        callback(new Response(null, new OrionError('ORION_TRANSPORT', res.message)));
      } else {
        const RESULT = this._codec.decode(res);
        let response = new Response(RESULT.payload, RESULT.error);
        response.payload = this._tryParse(response.payload);
        DEBUG('got response:', response);
        CLOSE_TRACER();
        callback(response);
      }
    }, this.getCallTimeout(req.path, req.callTimeout));
  }

  private _handle(path: string, callback: Function, logging: boolean, prefix?: string) {
    const ROUTE = `${prefix || this.name}.${path}`;
    DEBUG('register handler:', ROUTE);
    this._transport.handle(ROUTE, this.name, (data, send) => {

      const DATA = this._codec.decode(data);
      let req = new Request(DATA.path, this._tryParse(DATA.params));
      req.meta = DATA.meta;
      req.tracerData = DATA.tracerData;

      if (logging) {
        this.logger.createMessage(path)
                   .setLevel(6)
                   .setId(req.getId())
                   .setParams(req.params)
                   .send();
      }

      DEBUG('incoming request:', req);

      callback(req, (res: Response) => {
        this._checkResponse(res);
        if (res.error && logging) {

          this.logger.createMessage(path)
                     .setLevel(3)
                     .setId(req.getId())
                     .setParams(JSON.stringify(res.error))
                     .send();
        }
        res.payload = this._toBuffer(res.payload);
        send(this._codec.encode(res));

      });
    });
  }

  private _serializeRequest(request: Request, callback?: Function) {
    let route = request.path;

    // services registered with names like `service.method`
    // but we support `/service/method` style calls as well
    // hence we need to "normalize" the route here.
    route = route.replace(/\//gi, '.');
    if (route.startsWith('.')) {
      route = route.substring(1);
    }

    if (!callback) {
      callback = noop;
    }

    if (!route) {
      return callback(new Error('Invalid request path'));
    }

    if (this.options.service) {
      route = `${this.options.service}.${route}`;
    }

    const REQ = new Request(request.path, this._toBuffer(request.params));
    REQ.callTimeout = request.callTimeout;
    REQ.tracerData = request.tracerData;
    REQ.meta = request.meta;

    DEBUG('calling:', route);
    DEBUG('sending request:', request);
    this._call(route, REQ, callback);
  }

  private _checkResponse(res: Response) {
    if (res instanceof Response === false) {
      throw new Error('The response must instance of Orion.Response');
    }
    if (res.error !== undefined &&
        res.error instanceof OrionError === false) {
      throw new Error('The passed error must instance of Orion.Error');
    }
  }

  private _toBuffer(payload: any): Buffer {
    if (payload === undefined) {
      payload = null;
    }
    return Buffer.from(JSON.stringify(payload));
  }

  private _tryParse(data: any): any {
    if (data === undefined || data === null) {
      return data;
    }
    if (typeof data !== 'string') {
      data = data.toString();
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }

}
