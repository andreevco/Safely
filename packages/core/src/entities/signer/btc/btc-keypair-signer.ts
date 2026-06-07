import { assertBtcFeeIsNotAbsurd } from './assert-btc-fee';
import type { BtcSigningRequest, IBtcSigner } from './I-btc-signer';
import type { IBtcNodeProducer } from '../../derivation/btc/I-btc-node-producer';

export class BtcKeypairSigner implements IBtcSigner {
    constructor(private readonly nodeProducer: IBtcNodeProducer) {}

    public async sign({ psbt, utxos }: BtcSigningRequest): Promise<Buffer> {
        const node = await this.nodeProducer.getPortfolioDerivation();

        for (let i = 0; i < utxos.length; i++) {
            const u = utxos[i];
            const privateKey = node
                .deriveChild(u.derivationPath.change)
                .deriveChild(u.derivationPath.addressIndex).privateKey;

            if (!privateKey) {
                throw new Error(`Missing private key for input ${i}`);
            }

            if (!psbt.signIdx(privateKey, i)) {
                throw new Error(`Invalid signature for input ${i}`);
            }
        }

        psbt.finalize();

        assertBtcFeeIsNotAbsurd(psbt);

        return Buffer.from(psbt.extract());
    }
}
