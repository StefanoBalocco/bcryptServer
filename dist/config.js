"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const os = require("os");
const cores = os.cpus();
const workers = ((0 < cores.length) ? cores.length : 1);
exports.config = {
    APP: {
        ip: '127.0.0.1',
        port: 8001,
        logpath: './log',
        minWorkers: workers,
        maxWorkers: workers
    },
    HTTPS: {
        certificate: undefined,
        key: undefined
    }
};
