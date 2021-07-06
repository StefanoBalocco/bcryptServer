/// <reference types="node" />
export declare class bcryptClient {
    private silentFallback;
    private baseUrl;
    private options;
    constructor(baseUrl: string, cacert?: Buffer, silentFallback?: boolean);
    hash(data: string, rounds: number): Promise<any>;
    compare(data: string, hash: string): Promise<boolean>;
}
