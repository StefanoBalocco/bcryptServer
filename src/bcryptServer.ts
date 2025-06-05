import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import mri from 'mri';
import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer as createHttpsServer } from 'node:https';
import path from 'path';
import workerpool from 'workerpool';
import ZeptoLogger from 'zeptologger';
import { Config, DefaultConfig } from './DefaultConfig.js';

interface bcryptResponse<T> {
	error?: string;
	result?: T;
}

const _logger = ZeptoLogger.GetLogger();
_logger.minLevel = ZeptoLogger.LogLevel.INFO;

class bcryptServer {
	private readonly _config: Config;
	private _workerPool: workerpool.Pool;
	private _app: Hono = new Hono();
	private _webserver: any;

	constructor( config: Config = DefaultConfig ) {
		this._config = config;
		this._logOpenStream();
		this._workerPool = workerpool.pool(
			path.join( import.meta.dirname, 'Worker.js' ),
			{
				minWorkers: this._config.minWorkers,
				maxWorkers: config.maxWorkers
			}
		);

		// 404 handler
		this._app.notFound(
			( context ) => {
				_logger.log( ZeptoLogger.LogLevel.ERROR, '404 Not found: ' + context.req.url );
				return context.json( { error: 'Not found' }, 404 );
			}
		);

		// Routes
		this._app.post(
			'/hash',
			async( context ) => {
				let returnValue: [ bcryptResponse<string>, ( 200 | 400 ) ] = [ {}, 200 ];
				try {
					const body = await context.req.json();
					if( 'string' === typeof body?.data ) {
						const rounds: number = ( ( 'number' === typeof body[ 'rounds' ] ) ? body[ 'rounds' ] : config.rounds );
						returnValue[ 0 ] = await this.hash( body[ 'data' ], rounds );
					} else {
						returnValue[ 0 ].error = 'Invalid or missing data';
						returnValue[ 1 ] = 400;
					}
				} catch( error ) {
					returnValue[ 0 ].error = 'Invalid or missing data';
					returnValue[ 1 ] = 400;
					_logger.log( ZeptoLogger.LogLevel.ERROR, 'Error while processing hash request' + ( ( error instanceof Error ) ? ': ' + error.message : '' ) );
				}
				return context.json( returnValue[ 0 ], returnValue[ 1 ] );
			}
		);

		this._app.post(
			'/compare',
			async( context ) => {
				let returnValue: [ bcryptResponse<boolean>, ( 200 | 400 ) ] = [ {}, 200 ];
				try {
					const body = await context.req.json();
					if( ( 'string' === typeof body?.data ) && ( 'string' === typeof body?.hash ) ) {
						returnValue[ 0 ] = await this.compare( body[ 'data' ], body[ 'hash' ] );
					} else {
						returnValue[ 0 ].error = 'Invalid or missing data';
						returnValue[ 1 ] = 400;
					}
				} catch( error ) {
					returnValue[ 0 ].error = 'Invalid or missing data';
					returnValue[ 1 ] = 400;
					_logger.log( ZeptoLogger.LogLevel.ERROR, 'Error while processing compare request' + ( ( error instanceof Error ) ? ': ' + error.message : '' ) );
				}
				return context.json( returnValue[ 0 ], returnValue[ 1 ] );
			}
		);
	}

	public async reloadCertificates() {
		if( this._config.certificate && this._config.certificateKey && this._webserver ) {
			try {
				const certificate: Buffer = await readFile( this._config.certificate );
				if( certificate ) {
					const key: Buffer = await readFile( this._config.certificateKey );
					if( key ) {
						this._webserver.setSecureContext( { key: key, cert: certificate } );
						_logger.log( ZeptoLogger.LogLevel.INFO, 'Reloaded SSL certificates' );
					}
				}
			} catch( error ) {
				_logger.log( ZeptoLogger.LogLevel.ERROR, 'Error while reading SSL certificate or key' + ( ( error instanceof Error ) ? ': ' + error.message : '' ) );
			}
		}
	}

	public async compare( data: string, hash: string ): Promise<bcryptResponse<boolean>> {
		let returnValue: bcryptResponse<boolean> = {};
		try {
			returnValue.result = await this._workerPool.exec( 'compare', [ data, hash ] ) as boolean;
		} catch( error ) {
			returnValue.error = error instanceof Error ? error.message : 'unknown error';
			_logger.log( ZeptoLogger.LogLevel.ERROR, error );
		}
		return returnValue;
	}

	public async hash( data: string, rounds: number ): Promise<bcryptResponse<string>> {
		let returnValue: bcryptResponse<string> = {};
		try {
			returnValue.result = await this._workerPool.exec( 'hash', [ data, rounds ] ) as string;
		} catch( error ) {
			returnValue.error = error instanceof Error ? error.message : 'unknown error';
			_logger.log( ZeptoLogger.LogLevel.ERROR, error );
		}
		return returnValue;
	}

	async Start(): Promise<void> {
		const server: {
			fetch: any,
			ip: string,
			port: number,
			createServer?: any,
			serverOptions?: any
		} = {
			fetch: this._app.fetch,
			ip: this._config.ip,
			port: this._config.port
		};
		if( this._config.certificate && this._config.certificateKey ) {
			try {
				const certificate: Buffer = await readFile( this._config.certificate );
				if( certificate && 0 < certificate.length ) {
					const certificateKey: Buffer = await readFile( this._config.certificateKey );
					if( certificateKey && 0 < certificateKey.length ) {
						server.createServer = createHttpsServer;
						server.serverOptions = {
							key: certificateKey,
							cert: certificate
						};
					}
				}
			} catch( error ) {
				_logger.log( ZeptoLogger.LogLevel.ERROR, 'Error while reading SSL certificate or key' + ( ( error instanceof Error ) ? ': ' + error.message : '' ) );
			}
		}
		this._webserver = serve( server );
		if( this._webserver ) {
			_logger.log( ZeptoLogger.LogLevel.NOTICE, 'bcrypt server started' );
		} else {
			_logger.log( ZeptoLogger.LogLevel.CRITICAL, 'bcrypt server wasn\'t started' );
		}
	}

	public _logOpenStream(): void {
		_logger.destination = createWriteStream( path.resolve( path.join( this._config.logpath, 'bcryptServer.log' ) ), { flags: 'a' } );
		_logger.log( ZeptoLogger.LogLevel.INFO, 'Log file opened' );
	}
}

let _config: Config = DefaultConfig;
try {
	const args = mri(
		process.argv.slice( 2 ), {
			alias: { c: 'config' }
		}
	);
	if( args.config ) {
		const _filename: string = path.resolve( args.config );
		const _userConfigData: string = await readFile( _filename, 'utf8' );
		const _userConfig: Config = JSON.parse( _userConfigData );
		_config = { ...DefaultConfig, ..._userConfig };
	}

	const _server = new bcryptServer( _config );

	process.on( 'SIGHUP', async(): Promise<void> => {
		_server._logOpenStream();
		await _server.reloadCertificates();
	} );

	await _server.Start();
} catch( error ) {
	_logger.log( ZeptoLogger.LogLevel.CRITICAL, 'exception while starting the server: ' + ( error instanceof Error ? error.message : error ) );
	process.exit( 1 );
}
