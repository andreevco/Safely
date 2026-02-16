import { BootConfig } from '../../api/boot/models';

export class BtcExplorer {
    constructor(private readonly config: BootConfig['blockchains']['bitcoin']['mainnet']) {}

    public wallet(address: string): string {
        return this.config.explorer_account_url.replace('{address}', address);
    }
    public transaction(txid: string): string {
        return this.config.explorer_tx_url.replace('{txid}', txid);
    }
}
