import { Next } from 'koa';
import { RouterContext } from 'koa-router';
import * as path from 'path';
import * as workerpool from 'workerpool';
import { config } from './config';
import { Utilities } from './Utilities';

const { Logbro } = require( 'logbro' );
Logbro.level = 'info';
const logger = require( 'logbro' );

export class Backend {
	private workerPool = workerpool.pool( path.join( __dirname, 'Worker.js' ), { minWorkers: config.APP.minWorkers, maxWorkers: config.APP.maxWorkers } );

	constructor() {
	}

	public async compare( context: RouterContext, next: Next ) {
		let error: string;
		let returnValue: { error?: string, result?: boolean } = {};
		if( context.request.body?.data ) {
			if( context.request.body.hash ) {
				const [ workerOutput, errorWorkerOutput ]: [ { result?: boolean, error?: string }, Error ] = await Utilities.result<{ result?: boolean, error?: string }, Error>( <Promise<{ result?: boolean, error?: string }>> <unknown> this.workerPool.exec( 'compare', [ context.request.body.data, context.request.body.hash ] ) );
				if( workerOutput && !workerOutput.error ) {
					returnValue.result = workerOutput.result;
				} else {
					error = 'No result';
					if( workerOutput?.error ) {
						error = workerOutput.error;
					} else if( errorWorkerOutput ) {
						logger.error( errorWorkerOutput.message );
					}
				}
			} else {
				error = 'Missing hash';
			}
		} else {
			error = 'Missing data';
		}
		if( error ) {
			logger.error( error );
			returnValue.error = error;
		}
		context.response.body = returnValue;
		next();
	}

	public async hash( context: RouterContext, next: Next ) {
		let error: string;
		let returnValue: { error?: string, result?: string } = {};
		if( context.request.body?.data ) {
			if( context.params?.rounds ) {
				let rounds = parseInt( context.params.rounds );
				if( !Number.isNaN( rounds ) && 0 < rounds ) {
					const [ workerOutput, errorWorkerOutput ]: [ { result?: string, error?: string }, Error ] = await Utilities.result<{ result?: string, error?: string }, Error>( <Promise<{ result?: string, error?: string }>> <unknown> this.workerPool.exec( 'hash', [ context.request.body.data, rounds ] ) );
					if( workerOutput && !workerOutput.error ) {
						returnValue.result = workerOutput.result;
					} else {
						error = 'No result';
						if( workerOutput?.error ) {
							error = workerOutput.error;
						} else if( errorWorkerOutput ) {
							logger.error( errorWorkerOutput.message );
						}
					}
				} else {
					error = 'Invalid rounds';
				}
			} else {
				error = 'Missing rounds';
			}
		} else {
			error = 'Missing data';
		}
		if( error ) {
			logger.error( error );
			returnValue.error = error;
		}
		context.response.body = returnValue;
		next();
	}
}