import crypto = require('crypto');
import debug = require('debug');

/**
 * @module utils
 */

export function debugLog(section: string) {
    return debug(section);
}

// @private
const UIDCHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate short unique ids.
 */
export function generateId(len: number = 7, hex?: boolean) {
    const BUF = crypto.randomBytes(len);
    if (hex) {
        return BUF.toString('hex');
    } else {
        let str = [];
        for (let i = 0; i < BUF.length; i++) {
            str.push(UIDCHARS[BUF[i] % UIDCHARS.length]);
        }
        return str.join('');
    }
}
