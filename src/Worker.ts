import bcrypt from 'bcrypt';
import workerpool from 'workerpool';

async function compare( data: string, hash: string ): Promise<boolean> {
	let returnValue: boolean = false;
	if( data && ( 0 < data.length ) && ( 72 >= data.length ) ) {
		if( hash ) {
			returnValue = await bcrypt.compare( data, hash );
		} else {
			throw new Error( 'Compare: missing or invalid hash' );
		}
	} else {
		throw new Error( 'Worker.hash: missing, invalid or too much data' );
	}
	return returnValue;
}

async function hash( data: string, rounds: number ): Promise<string> {
	let returnValue: string;
	if( data && ( 0 < data.length ) && ( 72 >= data.length ) ) {
		if( rounds && Number.isInteger( rounds ) && 9 < rounds && 20 > rounds ) {
			returnValue = await bcrypt.hash( data, rounds );
			if( ( 59 > returnValue.length ) || ( 60 < returnValue.length ) ) {
				throw new Error( 'Worker.hash: wrong result (' + returnValue + ')' );
			}
		} else {
			throw new Error( 'Worker.hash: missing, invalid or low number of rounds' );
		}
	} else {
		throw new Error( 'Worker.hash: missing, invalid or too much data' );
	}
	return returnValue;
}

workerpool.worker( {
	compare: compare,
	hash: hash
} );