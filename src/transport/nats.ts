import nats = require('nats');
import { debugLog } from '../utils';

const DEBUG = debugLog('orion:transport:nats');

/**
 * NATS transport.
 */
export class NatsTransport {

  private _client: nats.Client;
  private _heartbeat: NodeJS.Timer;

  private _closeHandler: Function;

  /**
   * Create new NATS transport.
   */
  constructor(private _options?: any) {
    this._options = Object.assign({
      url: process.env.NATS || 'nats://localhost:4222',
      encoding: 'binary'
    }, _options);
    this._client = nats.connect(this._options);

    this._client.on('error', function(e) {
      DEBUG(e);
      process.exit(1);
    });

    this.heartbeat();
  }

  /**
   * NATS heartbeat check based on
   * https://github.com/nats-io/node-nats/issues/173
   */
  heartbeat() {
    let timeout = null;
    this._heartbeat = setInterval(() => {
      timeout = setTimeout(() => {
        timeout = null;
      }, 500);
      this.listen(() => {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
      });
    }, 1000);
  }

  /**
   * Transport listen.
   */
  public listen(callback: Function) {
    try {
      this._client.flush((err) => {
        if (err) {
          throw err;
        }
        if (callback && callback instanceof Function) {
          callback();
        }
      });
    } catch (e) {
      if (e.code === nats.CONN_CLOSED && this._closeHandler) {
        this._closeHandler();
      }
      throw e;
    }
  }

  /**
   * Publish to a topic.
   */
  public publish(topic: string, message: any) {
    try {
      this._client.publish(topic, message);
    } catch (e) {
      if (e.code === nats.CONN_CLOSED && this._closeHandler) {
        this._closeHandler();
      }
      throw e;
    }
  }

  /**
   * Subscribe to a topic.
   */
  public subscribe(topic: string, group: string, callback: Function) {
    try {
      return this._client.subscribe(topic, { queue: group }, callback);
    } catch (e) {
      if (e.code === nats.CONN_CLOSED && this._closeHandler) {
        this._closeHandler();
      }
      throw e;
    }
  }

  /**
  * Unsubscribe from a topic.
  */
  public unsubscribe(sid: number, max?: number) {
    try {
      this._client.unsubscribe(sid, max);
    } catch (e) {
      if (e.code === nats.CONN_CLOSED && this._closeHandler) {
        this._closeHandler();
      }
      throw e;
    }
  }

  /**
   * Transport handle.
   */
  public handle(route: string, group: string, callback: Function) {
    try {
      DEBUG('register handler:', route);
      this._client.subscribe(route, { queue: group }, (req, replyTo) => {
        DEBUG('incoming request:', req, replyTo);
        callback(req, res => {
          DEBUG('sending response:', replyTo, res);
          this._client.publish(replyTo, res);
        });
      });
    } catch (e) {
      if (e.code === nats.CONN_CLOSED && this._closeHandler) {
        this._closeHandler();
      }
      throw e;
    }
  }

  /**
   * Client request.
   * Nats client implements this pattern out of the box.
   * Publish a request with an implicit inbox listener as the response.
   * This should be treated as a subscription.
   */
  public request(route: string, payload: any, callback: Function, timeout: number = 200) {
    try {
      DEBUG('sending request:', route);
      const SID = this._client.request(route, payload, { max: 1 }, response => {
        DEBUG('got response:', response);
        callback(response);
      });
      this._client.timeout(SID, timeout, 1, () => {
        DEBUG('request timeout:', route);
        callback(new Error(`Transport timeout: ${route}`));
      });
    } catch (e) {
      if (e.code === nats.CONN_CLOSED && this._closeHandler) {
        this._closeHandler();
      }
      throw e;
    }
  }

  /**
   * Close connection.
   */
  public close() {
    this._client.close();
    if (this._heartbeat) {
      clearInterval(this._heartbeat);
    }
  }

  /**
   * Connection closed handler
   * @param {(...args: any[]) => void} callback
   */
  onClose(callback: (...args: any[]) => void) {
    if (callback) {
      this._closeHandler = callback;
      this._client.on('close', callback);
    }
  }
}
