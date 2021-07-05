export class Utilities {
	static result<M, N>( promise: Promise<M> ): Promise<[ M, N ]> {
		return promise
			.then( ( result: M ): [ M, N ] => ( [ result, undefined ] ) )
			.catch( ( error: N ): [ M, N ] => ( [ undefined, error ] ) );
	}
}