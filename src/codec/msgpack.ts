import msgpack = require('msgpack-lite');
import { debugLog } from '../utils';
import { OrionError } from '../error/error';

const DEBUG = debugLog('orion:codec:msgpack');

/**
 * MessagePack, an efficient binary serialization format.
 */
export class MsgPackCodec {
  public encoding = null;
  public contentType = 'application/msgpack';

  /**
   * Encode data.
   */
  public encode(data: any) {
    DEBUG('encode');
    return msgpack.encode(data);
  }

  /**
   * Decode data.
   */
  public decode(data: any) {
    DEBUG('decode');
    return msgpack.decode(Buffer.from(data, 'binary'));
  }
}
