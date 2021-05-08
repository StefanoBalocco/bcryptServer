#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const https = require("https");
const Koa = require("koa");
const KoaBody = require("koa-body");
const KoaRouter = require("koa-router");
const path = require("path");
const util_1 = require("util");
const Backend_1 = require("./Backend");
const config_1 = require("./config");
const version = require('../package.json').version;
function LogOpenStream() {
    logger.stdout = fs_1.createWriteStream(path.join(config_1.config.APP.logpath, 'default.log'), { flags: 'a' });
    logger.stderr = fs_1.createWriteStream(path.join(config_1.config.APP.logpath, 'errors.log'), { flags: 'a' });
    logger.info('Log file opened');
}
const { Logbro } = require('logbro');
Logbro.level = 'info';
const logger = require('logbro');
LogOpenStream();
process.on('SIGHUP', LogOpenStream);
async function main() {
    var _a, _b;
    const app = new Koa();
    const router = new KoaRouter();
    const backend = new Backend_1.Backend();
    router.post('/compare', KoaBody(), async (ctx, next) => backend.compare(ctx, next));
    router.post('/hash/:rounds', KoaBody(), async (ctx, next) => backend.hash(ctx, next));
    app.use(router.routes());
    app.use(router.allowedMethods());
    if (config_1.config.HTTPS.key && config_1.config.HTTPS.certificate) {
        const [certificate, error] = await Backend_1.Backend.result(util_1.promisify(fs_1.readFile)(config_1.config.HTTPS.certificate));
        if (certificate) {
            const [key, error] = await Backend_1.Backend.result(util_1.promisify(fs_1.readFile)(config_1.config.HTTPS.key));
            if (key) {
                https.createServer({ cert: certificate, key: key }, app.callback()).listen(config_1.config.APP.port, config_1.config.APP.ip, function () {
                    logger.info('bcrypt server v' + version + ' started');
                });
            }
            else {
                logger.error('key not found' + ((_a = !error) !== null && _a !== void 0 ? _a : ': ' + error.message));
            }
        }
        else {
            logger.error('certificate not found' + ((_b = !error) !== null && _b !== void 0 ? _b : ': ' + error.message));
        }
    }
    else {
        app.listen(config_1.config.APP.port, config_1.config.APP.ip, function () {
            logger.info('bcrypt server v' + version + ' started');
        });
    }
}
main();
