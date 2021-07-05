import * as bcrypt from 'bcrypt';
import * as needle from 'needle';
import { Utilities } from './Utilities';

export class bcryptClient {
	private silentFallback: boolean;
	private baseUrl: string;
	private options: needle.NeedleOptions = {
		compressed: true,
		follow_max: 0,
		open_timeout: 2000,
		response_timeout: 5000,
		rejectUnauthorized: true
	};

	constructor( baseUrl: string, cacert: Buffer = undefined, silentFallback = true ) {
		this.baseUrl = baseUrl;
		if( cacert ) {
			this.options.ca = cacert;
		}
		this.silentFallback = silentFallback;
	}

	public async Hash( data: string, rounds: number ) {
		let error: Error;
		let returnValue = undefined;
		const [ response, errorNeedle ] = await Utilities.result<needle.NeedleResponse, Error>( needle(
			'post',
			this.baseUrl + '/Hash/' + rounds,
			{
				data: data
			}
		) );
		if( ( 200 === response?.statusCode ) && ( 'undefined' === typeof response.body.result ) ) {
			returnValue = response.body.result;
		} else {
			if( this.silentFallback ) {
				let errorBcrypt;
				[ returnValue, errorBcrypt ] = await Utilities.result<string, Error>( bcrypt.hash( data, rounds ) );
				if( 'undefined' === typeof returnValue ) {
					error = errorBcrypt ?? new Error( 'undefined' );
				}
			} else {
				if( errorNeedle ) {
					error = errorNeedle;
				} else {
					error = new Error( 'error while parsing response' );
					if( !response ) {
						error = new Error( 'no response' );
					} else if( 200 != response.statusCode ) {
						error = new Error( 'errorcode ' + response.statusCode );
					} else if( 'undefined' === typeof response.body.result ) {
						error = new Error( 'no result' );
					}
					if( response.body.error ) {
						error = new Error( response.body.error );
					}
				}
			}
		}
		if( error ) {
			throw error;
		}
		return returnValue;
	}

	public async Compare( data: string, hash: string ) {
		let error: Error;
		let returnValue: boolean = false;
		const [ response, errorNeedle ] = await Utilities.result<needle.NeedleResponse, Error>( needle(
			'post',
			this.baseUrl + '/Compare',
			{
				data: data,
				hash: hash
			}
		) );
		if( ( 200 === response?.statusCode ) && ( 'undefined' === typeof response.body.result ) ) {
			returnValue = response.body.result;
		} else {
			if( this.silentFallback ) {
				let errorBcrypt;
				[ returnValue, errorBcrypt ] = await Utilities.result<boolean, Error>( bcrypt.compare( data, hash ) );
				if( 'undefined' === typeof returnValue ) {
					error = errorBcrypt ?? new Error( 'undefined' );
				}
			} else {
				if( errorNeedle ) {
					error = errorNeedle;
				} else {
					error = new Error( 'error while parsing response' );
					if( !response ) {
						error = new Error( 'no response' );
					} else if( 200 != response.statusCode ) {
						error = new Error( 'errorcode ' + response.statusCode );
					} else if( 'undefined' === typeof response.body.result ) {
						error = new Error( 'no result' );
					}
					if( response.body.error ) {
						error = new Error( response.body.error );
					}
				}
			}
		}
		if( error ) {
			throw error;
		}
		return returnValue;
	}
}