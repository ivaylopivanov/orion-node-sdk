import { Codec, Transport, Tracer, Options, Logger } from '../types/interfaces';
import { DefaultBinaryCodec as DefaultCodec } from '../codec';
import { DefaultTransport } from '../transport';
import { Tracer as DefatulTracer } from '../tracer/tracer';
import { Logger as DefaultLogger } from '../logger/logger';
import * as LOGGER_LEVELS from '../logger/levels';
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
      timeout: 200,
      timeouts: {},
    }, options);
    this._codec = new DefaultCodec();
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
   * Connection closed handler
   * @param {Function} callback
   */
  onClose(callback) {
    this._transport.onClose(() => {
      DEBUG('on close');
      callback();
    });
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

  private _getCallTimeout(path: string, timeout: number) {
    let options = this.options;
    let specificCallTimeout =
      options.timeout && options.timeouts[path];

    return timeout || specificCallTimeout || options.timeout;
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
        DEBUG('got response:', response);
        CLOSE_TRACER();
        callback(response);
      }
    }, this._getCallTimeout(req.path, req.timeout));
  }

  private _handle(path: string, callback: Function, logging: boolean, prefix?: string) {
    const ROUTE = `${prefix || this.name}.${path}`;
    DEBUG('register handler:', ROUTE);
    this._transport.handle(ROUTE, this.name, (data, send) => {

      const DATA = this._codec.decode(data);
      let req = new Request(DATA.path, DATA.params);
      req.meta = DATA.meta;
      req.tracerData = DATA.tracerData;

      if (logging) {
        this.logger.createMessage(path)
                   .setLevel(LOGGER_LEVELS.INFO)
                   .setId(req.getId())
                   .setParams(req.params)
                   .send();
      }

      DEBUG('incoming request:', req);

      callback(req, (res: Response) => {
        this._checkResponse(res);
        if (res.error && logging) {

          this.logger.createMessage(path)
                     .setLevel(LOGGER_LEVELS.ERROR)
                     .setId(req.getId())
                     .setParams(JSON.stringify(res.error))
                     .send();
        }
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

    let req = new Request(request.path, request.params);
    req.timeout = request.timeout;
    req.tracerData = request.tracerData;
    req.meta = request.meta;

    DEBUG('calling:', route);
    DEBUG('sending request:', request);
    this._call(route, req, callback);
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

}
