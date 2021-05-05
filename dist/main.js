"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const Koa = require("koa");
const KoaBody = require("koa-body");
const KoaRouter = require("koa-router");
const path = require("path");
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
    const app = new Koa();
    const router = new KoaRouter();
    const backend = new Backend_1.Backend();
    router.post('/compare', KoaBody(), async (ctx, next) => backend.compare(ctx, next));
    router.post('/hash/:rounds', KoaBody(), async (ctx, next) => backend.hash(ctx, next));
    app.use(router.routes());
    app.use(router.allowedMethods());
    app.listen(config_1.config.APP.port, config_1.config.APP.ip, function () {
        logger.info('bcrypt server v' + version + ' started');
    });
}
main();
