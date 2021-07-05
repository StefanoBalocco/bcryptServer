"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const fs_1 = require("fs");
const path = require("path");
const worker_threads_1 = require("worker_threads");
const workerpool = require("workerpool");
const config_1 = require("./config");
const Utilities_1 = require("./Utilities");
function LogOpenStream() {
    logger.stdout = fs_1.createWriteStream(path.join(config_1.config.APP.logpath, 'worker.default.' + worker_threads_1.threadId + '.log'), { flags: 'a' });
    logger.stderr = fs_1.createWriteStream(path.join(config_1.config.APP.logpath, 'worker.error.' + worker_threads_1.threadId + '.log'), { flags: 'a' });
    logger.info('Log file opened');
}
const { Logbro } = require('logbro');
Logbro.level = 'info';
const logger = require('logbro');
LogOpenStream();
process.on('SIGHUP', LogOpenStream);
async function Compare(data, hash) {
    let error;
    let returnValue = {};
    if (data && ('string' === typeof data)) {
        if (hash && ('string' === typeof hash)) {
            const [resultBcrypt, errorBcrypt] = await Utilities_1.Utilities.result(bcrypt.compare(data, hash));
            if ('undefined' !== typeof resultBcrypt) {
                returnValue.result = resultBcrypt;
            }
            else {
                error = 'no result';
                if (errorBcrypt) {
                    logger.error(errorBcrypt);
                }
            }
        }
        else {
            error = 'compare: missing or invalid hash';
        }
    }
    else {
        error = 'compare: missing or invalid data';
    }
    if (error) {
        returnValue.error = error;
    }
    return returnValue;
}
async function Hash(data, rounds) {
    let error;
    let returnValue = {};
    if (data && ('string' === typeof data)) {
        if (rounds && Number.isInteger(rounds)) {
            const [resultBcrypt, errorBcrypt] = await Utilities_1.Utilities.result(bcrypt.hash(data, rounds));
            if ('undefined' !== typeof resultBcrypt) {
                returnValue.result = resultBcrypt;
            }
            else {
                error = 'no result';
                if (errorBcrypt) {
                    logger.error(errorBcrypt);
                }
            }
        }
        else {
            error = 'compare: missing or invalid rounds';
        }
    }
    else {
        error = 'compare: missing or invalid data';
    }
    if (error) {
        returnValue.error = error;
    }
    return returnValue;
}
workerpool.worker({
    compare: Compare,
    hash: Hash
});
