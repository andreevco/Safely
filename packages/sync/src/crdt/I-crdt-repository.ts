export interface ICRDTRepository<CRDT> {
    saveCRDT(crdt: CRDT): Promise<void>;
    loadCRDT(): Promise<CRDT>;
}
