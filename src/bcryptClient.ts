import { CpuInfo, cpus } from 'node:os';
import path from 'path';
import { Agent, Dispatcher, request } from 'undici';
import workerpool from 'workerpool';

type Undefinedable<T> = T | undefined;

interface bcryptResponse<T> {
	error?: string;
	result?: T;
}

export default class bcryptClient {
	private readonly _baseUrl: string;
	private _workerPool: Undefinedable<workerpool.Pool>;
	private _agent: Agent;
	private _rounds: number;

	public constructor( baseUrl: string, cacert: Undefinedable<Buffer> = undefined, maxConcurrencyFallback: number = -1, rounds: number = 12 ) {
		this._baseUrl = baseUrl;
		this._rounds = rounds;
		const agentOptions: Agent.Options = {
			connectTimeout: 2000,
			headersTimeout: 5000,
			bodyTimeout: 5000,
			keepAliveTimeout: 4000,
			keepAliveMaxTimeout: 10000,
			maxRedirections: 0, // equivalente a follow_max: 0
			connect: {
				ca: cacert,
				rejectUnauthorized: true
			}
		};
		this._agent = new Agent( agentOptions );
		if( -1 === maxConcurrencyFallback ) {
			const cores: CpuInfo[] = cpus();
			maxConcurrencyFallback = Math.ceil( ( ( 0 < cores.length ) ? cores.length : 1 ) / 4 );
		}
		if( 0 < maxConcurrencyFallback ) {
			this._workerPool = workerpool.pool(
				path.join( import.meta.dirname, 'Worker.js' ), {
					minWorkers: 0,
					maxWorkers: maxConcurrencyFallback,
					workerType: 'thread' // usa worker threads invece di processi
				}
			);
		}
	}

	public async hash( data: string, rounds: Undefinedable<number> ): Promise<bcryptResponse<string>> {
		let returnValue: bcryptResponse<string> = {};
		try {
			const response: Dispatcher.ResponseData = await request(
				this._baseUrl + '/hash', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept-Encoding': 'gzip, deflate' // equivalente a compressed: true
					},
					body: JSON.stringify( { data: data, rounds: ( rounds ?? this._rounds ) } ),
					dispatcher: this._agent
				}
			);
			returnValue = await response.body.json() as bcryptResponse<string>;
		} catch( error ) {
			returnValue.error = error instanceof Error ? error.message : 'unknown error';
		}
		if( returnValue.error && this._workerPool ) {
			returnValue = {};
			try {
				returnValue.result = await this._workerPool.exec( 'hash', [ data, rounds ] ) as string;
			} catch( error ) {
				returnValue.error = error instanceof Error ? error.message : 'unknown error';
			}
		}
		return returnValue;
	}

	public async compare( data: string, hash: string ): Promise<bcryptResponse<boolean>> {
		let returnValue: bcryptResponse<boolean> = {};
		try {
			const response: Dispatcher.ResponseData = await request(
				this._baseUrl + '/compare', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept-Encoding': 'gzip, deflate' // equivalente a compressed: true
					},
					body: JSON.stringify( { data: data, hash: hash } ),
					dispatcher: this._agent
				}
			);
			returnValue = await response.body.json() as bcryptResponse<boolean>;
		} catch( error ) {
			returnValue.error = error instanceof Error ? error.message : 'unknown error';
		}
		if( returnValue.error && this._workerPool ) {
			returnValue = {};
			try {
				returnValue.result = await this._workerPool.exec( 'compare', [ data, hash ] ) as boolean;
			} catch( error ) {
				returnValue.error = error instanceof Error ? error.message : 'unknown error';
			}
		}
		return returnValue;
	}

	public async destroy(): Promise<void> {
		if( this._workerPool ) {
			await this._workerPool.terminate();
		}
		await this._agent.destroy();
	}
}
