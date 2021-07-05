#!/usr/bin/env node
import { createWriteStream, readFile } from 'fs';
import * as https from 'https';
import * as Koa from 'koa';
import * as KoaBody from 'koa-body';
import * as KoaRouter from 'koa-router';
import * as path from 'path';
import { promisify } from 'util';
import { Backend } from './Backend';
import { config } from './config';
import { Utilities } from './Utilities';

const version = require( '../package.json' ).version;

function LogOpenStream() {
	logger.stdout = createWriteStream( path.join( config.APP.logpath, 'default.log' ), { flags: 'a' } );
	logger.stderr = createWriteStream( path.join( config.APP.logpath, 'errors.log' ), { flags: 'a' } );
	logger.info( 'Log file opened' );
}

const { Logbro } = require( 'logbro' );
Logbro.level = 'info';
const logger = require( 'logbro' );
LogOpenStream();
process.on( 'SIGHUP', LogOpenStream );

async function main() {
	const app: Koa = new Koa();
	const router: KoaRouter = new KoaRouter();
	const backend = new Backend();
	router.post( '/compare', KoaBody(), async( ctx, next ) => backend.compare( ctx, next ) );
	router.post( '/hash/:rounds', KoaBody(), async( ctx, next ) => backend.hash( ctx, next ) );
	app.use( router.routes() );
	app.use( router.allowedMethods() );
	if( config.HTTPS.key && config.HTTPS.certificate ) {
		const [ certificate, error ] = await Utilities.result<Buffer, Error>( promisify( readFile )( config.HTTPS.certificate ) );
		if( certificate ) {
			const [ key, error ] = await Utilities.result<Buffer, Error>( promisify( readFile )( config.HTTPS.key ) );
			if( key ) {
				https.createServer( { cert: certificate, key: key }, app.callback() ).listen( config.APP.port, config.APP.ip, function() {
					logger.info( 'bcrypt server v' + version + ' started' );
				} );
			} else {
				logger.error( 'key not found' + ( !error ?? ': ' + error.message ) );
			}
		} else {
			logger.error( 'certificate not found' + ( !error ?? ': ' + error.message ) );
		}
	} else {
		app.listen( config.APP.port, config.APP.ip, function() {
			logger.info( 'bcrypt server v' + version + ' started' );
		} );
	}
}

main();