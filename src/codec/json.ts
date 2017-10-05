import { debugLog } from '../utils';

const debug = debugLog('orion:codec:json');

/**
 * JavaScript Object Notation, a lightweight data-interchange format.
 */
export class JsonCodec {
    encoding = 'utf8';
    contentType = 'application/json';

    /**
     * Encode data.
     */
    encode(data: any) {
        debug('encode');
        return JSON.stringify(data);
    }

    /**
     * Decode data.
     */
    decode(data: any) {
        debug('decode');
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }
}
