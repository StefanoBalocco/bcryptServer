import path from 'path';
import { Agent, request } from 'undici';
import workerpool from 'workerpool';
export class bcryptClient {
    _baseUrl;
    _workerPool;
    _agent;
    _rounds;
    constructor(baseUrl, cacert = undefined, maxConcurrencyFallback = 2, rounds = 12) {
        this._baseUrl = baseUrl;
        this._rounds = rounds;
        const agentOptions = {
            connectTimeout: 2000,
            headersTimeout: 5000,
            bodyTimeout: 5000,
            keepAliveTimeout: 4000,
            keepAliveMaxTimeout: 10000,
            maxRedirections: 0,
            connect: {
                ca: cacert,
                rejectUnauthorized: true
            }
        };
        this._agent = new Agent(agentOptions);
        if (0 < maxConcurrencyFallback) {
            this._workerPool = workerpool.pool(path.join(__dirname, 'Worker.js'), {
                minWorkers: 0,
                maxWorkers: maxConcurrencyFallback,
                workerType: 'thread'
            });
        }
    }
    async hash(data, rounds) {
        let returnValue = {};
        try {
            const response = await request(this._baseUrl + '/hash', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip, deflate'
                },
                body: JSON.stringify({ data: data, rounds: (rounds ?? this._rounds) }),
                dispatcher: this._agent
            });
            returnValue = await response.body.json();
        }
        catch (error) {
            returnValue.error = error instanceof Error ? error.message : 'unknown error';
        }
        if (returnValue.error && this._workerPool) {
            returnValue = {};
            try {
                returnValue.result = await this._workerPool.exec('hash', [data, rounds]);
            }
            catch (error) {
                returnValue.error = error instanceof Error ? error.message : 'unknown error';
            }
        }
        return returnValue;
    }
    async compare(data, hash) {
        let returnValue = {};
        try {
            const response = await request(this._baseUrl + '/compare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip, deflate'
                },
                body: JSON.stringify({ data: data, hash: hash }),
                dispatcher: this._agent
            });
            returnValue = await response.body.json();
        }
        catch (error) {
            returnValue.error = error instanceof Error ? error.message : 'unknown error';
        }
        if (returnValue.error && this._workerPool) {
            returnValue = {};
            try {
                returnValue.result = await this._workerPool.exec('compare', [data, hash]);
            }
            catch (error) {
                returnValue.error = error instanceof Error ? error.message : 'unknown error';
            }
        }
        return returnValue;
    }
    async destroy() {
        if (this._workerPool) {
            await this._workerPool.terminate();
        }
        await this._agent.destroy();
    }
}
