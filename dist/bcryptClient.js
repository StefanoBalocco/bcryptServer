"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bcryptClient = void 0;
const bcrypt = require("bcrypt");
const needle = require("needle");
const Utilities_1 = require("./Utilities");
class bcryptClient {
    constructor(baseUrl, cacert = undefined, silentFallback = true) {
        this.options = {
            compressed: true,
            follow_max: 0,
            open_timeout: 2000,
            response_timeout: 5000,
            rejectUnauthorized: true
        };
        this.baseUrl = baseUrl;
        if (cacert) {
            this.options.ca = cacert;
        }
        this.silentFallback = silentFallback;
    }
    async hash(data, rounds) {
        let error;
        let returnValue = undefined;
        const [response, errorNeedle] = await Utilities_1.Utilities.result(needle('post', this.baseUrl + '/hash/' + rounds, {
            data: data
        }));
        if ((200 === (response === null || response === void 0 ? void 0 : response.statusCode)) && ('undefined' === typeof response.body.result)) {
            returnValue = response.body.result;
        }
        else {
            if (this.silentFallback) {
                let errorBcrypt;
                [returnValue, errorBcrypt] = await Utilities_1.Utilities.result(bcrypt.hash(data, rounds));
                if ('undefined' === typeof returnValue) {
                    error = errorBcrypt !== null && errorBcrypt !== void 0 ? errorBcrypt : new Error('undefined');
                }
            }
            else {
                if (errorNeedle) {
                    error = errorNeedle;
                }
                else {
                    error = new Error('error while parsing response');
                    if (!response) {
                        error = new Error('no response');
                    }
                    else if (200 != response.statusCode) {
                        error = new Error('errorcode ' + response.statusCode);
                    }
                    else if ('undefined' === typeof response.body.result) {
                        error = new Error('no result');
                    }
                    if (response.body.error) {
                        error = new Error(response.body.error);
                    }
                }
            }
        }
        if (error) {
            throw error;
        }
        return returnValue;
    }
    async compare(data, hash) {
        let error;
        let returnValue = false;
        const [response, errorNeedle] = await Utilities_1.Utilities.result(needle('post', this.baseUrl + '/compare', {
            data: data,
            hash: hash
        }));
        if ((200 === (response === null || response === void 0 ? void 0 : response.statusCode)) && ('undefined' === typeof response.body.result)) {
            returnValue = response.body.result;
        }
        else {
            if (this.silentFallback) {
                let errorBcrypt;
                [returnValue, errorBcrypt] = await Utilities_1.Utilities.result(bcrypt.compare(data, hash));
                if ('undefined' === typeof returnValue) {
                    error = errorBcrypt !== null && errorBcrypt !== void 0 ? errorBcrypt : new Error('undefined');
                }
            }
            else {
                if (errorNeedle) {
                    error = errorNeedle;
                }
                else {
                    error = new Error('error while parsing response');
                    if (!response) {
                        error = new Error('no response');
                    }
                    else if (200 != response.statusCode) {
                        error = new Error('errorcode ' + response.statusCode);
                    }
                    else if ('undefined' === typeof response.body.result) {
                        error = new Error('no result');
                    }
                    if (response.body.error) {
                        error = new Error(response.body.error);
                    }
                }
            }
        }
        if (error) {
            throw error;
        }
        return returnValue;
    }
}
exports.bcryptClient = bcryptClient;
