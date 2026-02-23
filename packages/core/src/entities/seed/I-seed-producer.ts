export interface ISeedProducer {
    getSeed(): Promise<Buffer>;
}
