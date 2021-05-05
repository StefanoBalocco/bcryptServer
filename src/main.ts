import { createWriteStream } from 'fs';
import * as Koa from 'koa';
import * as KoaBody from 'koa-body';
import * as KoaRouter from 'koa-router';
import * as path from 'path';
import { Backend } from './Backend';
import { config } from './config';

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
	app.listen( config.APP.port, config.APP.ip, function() {
		logger.info( 'bcrypt server v' + version + ' started' );
	} );
}

main();