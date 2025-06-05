type Undefinedable<T> = T | undefined;
interface bcryptResponse<T> {
    error?: string;
    result?: T;
}
export default class bcryptClient {
    private readonly _baseUrl;
    private _workerPool;
    private _agent;
    private _rounds;
    constructor(baseUrl: string, cacert?: Undefinedable<Buffer>, maxConcurrencyFallback?: number, rounds?: number);
    hash(data: string, rounds: Undefinedable<number>): Promise<bcryptResponse<string>>;
    compare(data: string, hash: string): Promise<bcryptResponse<boolean>>;
    destroy(): Promise<void>;
}
export {};
