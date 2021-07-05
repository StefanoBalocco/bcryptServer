import * as bcrypt from 'bcrypt';
import { createWriteStream } from 'fs';
import * as path from 'path';
import { threadId } from 'worker_threads';
import * as workerpool from 'workerpool';
import { config } from './config';
import { Utilities } from './Utilities';

function LogOpenStream() {
	logger.stdout = createWriteStream( path.join( config.APP.logpath, 'worker.default.' + threadId + '.log' ), { flags: 'a' } );
	logger.stderr = createWriteStream( path.join( config.APP.logpath, 'worker.error.' + threadId + '.log' ), { flags: 'a' } );
	logger.info( 'Log file opened' );
}

const { Logbro } = require( 'logbro' );
Logbro.level = 'info';
const logger = require( 'logbro' );
LogOpenStream();
process.on( 'SIGHUP', LogOpenStream );

async function Compare( data: string, hash: string ) {
	let error;
	let returnValue: { result?: boolean, error?: string } = {};
	if( data && ( 'string' === typeof data ) ) {
		if( hash && ( 'string' === typeof hash ) ) {
			const [ resultBcrypt, errorBcrypt ] = await Utilities.result<boolean, Error>( bcrypt.compare( data, hash ) );
			if( 'undefined' !== typeof resultBcrypt ) {
				returnValue.result = resultBcrypt;
			} else {
				error = 'no result';
				if( errorBcrypt ) {
					logger.error( errorBcrypt );
				}
			}
		} else {
			error = 'compare: missing or invalid hash';
		}
	} else {
		error = 'compare: missing or invalid data';
	}
	if( error ) {
		returnValue.error = error;
	}
	return returnValue;
}

async function Hash( data: string, rounds: number ) {
	let error;
	let returnValue: { result?: string, error?: string } = {};
	if( data && ( 'string' === typeof data ) ) {
		if( rounds && Number.isInteger( rounds ) ) {
			const [ resultBcrypt, errorBcrypt ] = await Utilities.result<string, Error>( bcrypt.hash( data, rounds ) );
			if( 'undefined' !== typeof resultBcrypt ) {
				returnValue.result = resultBcrypt;
			} else {
				error = 'no result';
				if( errorBcrypt ) {
					logger.error( errorBcrypt );
				}
			}
		} else {
			error = 'compare: missing or invalid rounds';
		}
	} else {
		error = 'compare: missing or invalid data';
	}
	if( error ) {
		returnValue.error = error;
	}
	return returnValue;
}

workerpool.worker( {
	compare: Compare,
	hash: Hash
} );