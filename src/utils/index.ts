import crypto = require('crypto');
import debug = require('debug');
import { OrionError } from '../error/error';

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

export function getLineFromError(e: Error) {
    // An example stack:
    /* Error
        at repl:1:1
        at ContextifyScript.Script.runInThisContext (vm.js:50:33)
        at REPLServer.defaultEval (repl.js:242:29)
        ...
     */
    // This regex gets:
    // (vm.js:50:33)
    // 1 vm.js
    // 2 50
    // 3 33
    const regex = /\((.*):(\d+):(\d+)\)$/;
    const match = regex.exec(e.stack.split('\n')[1]);
    return {
        filepath: match[1],
        line: match[2],
        column: match[3]
    };
}

export function StringifyError(e: Error|OrionError) {
    if (e instanceof OrionError) {
        return JSON.stringify({message: e.message, code: e.code});
    } else {
        return `{"message":"${e.message}"}`;
    }
}