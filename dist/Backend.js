"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Backend = void 0;
const path = require("path");
const workerpool = require("workerpool");
const config_1 = require("./config");
const { Logbro } = require('logbro');
Logbro.level = 'info';
const logger = require('logbro');
class Backend {
    constructor() {
        this.workerPool = workerpool.pool(path.join(__dirname, 'Worker.js'), { minWorkers: config_1.config.APP.minWorkers, maxWorkers: config_1.config.APP.maxWorkers });
    }
    static result(promise) {
        return promise
            .then((result) => ([result, undefined]))
            .catch((error) => ([undefined, error]));
    }
    async compare(context, next) {
        var _a;
        let error;
        let returnValue = {};
        if ((_a = context.request.body) === null || _a === void 0 ? void 0 : _a.data) {
            if (context.request.body.hash) {
                const [workerOutput, errorWorkerOutput] = await Backend.result(this.workerPool.exec('compare', [context.request.body.data, context.request.body.hash]));
                if (workerOutput && !workerOutput.error) {
                    returnValue.result = workerOutput.result;
                }
                else {
                    error = 'No result';
                    if (workerOutput === null || workerOutput === void 0 ? void 0 : workerOutput.error) {
                        error = workerOutput.error;
                    }
                    else if (errorWorkerOutput) {
                        logger.error(errorWorkerOutput.message);
                    }
                }
            }
            else {
                error = 'Missing hash';
            }
        }
        else {
            error = 'Missing data';
        }
        if (error) {
            logger.error(error);
            returnValue.error = error;
        }
        context.response.body = returnValue;
        next();
    }
    async hash(context, next) {
        var _a, _b;
        let error;
        let returnValue = {};
        if ((_a = context.request.body) === null || _a === void 0 ? void 0 : _a.data) {
            if ((_b = context.params) === null || _b === void 0 ? void 0 : _b.rounds) {
                let rounds = parseInt(context.params.rounds);
                if (!Number.isNaN(rounds) && 0 < rounds) {
                    const [workerOutput, errorWorkerOutput] = await Backend.result(this.workerPool.exec('hash', [context.request.body.data, rounds]));
                    if (workerOutput && !workerOutput.error) {
                        returnValue.result = workerOutput.result;
                    }
                    else {
                        error = 'No result';
                        if (workerOutput === null || workerOutput === void 0 ? void 0 : workerOutput.error) {
                            error = workerOutput.error;
                        }
                        else if (errorWorkerOutput) {
                            logger.error(errorWorkerOutput.message);
                        }
                    }
                }
                else {
                    error = 'Invalid rounds';
                }
            }
            else {
                error = 'Missing rounds';
            }
        }
        else {
            error = 'Missing data';
        }
        if (error) {
            logger.error(error);
            returnValue.error = error;
        }
        context.response.body = returnValue;
        next();
    }
}
exports.Backend = Backend;
