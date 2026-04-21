import * as ecc from '@bitcoinerlab/secp256k1';
import ECPairFactory from 'ecpair';

import { BtcSigningRequest, IBtcSigner } from './I-btc-signer';
import { btcNetworkConfig } from '../../blockchain';
import { BtcWalletReadOnly } from '../../derivation';
import { IBtcNodeProducer } from '../../derivation/btc/I-btc-node-producer';

const ECPair = ECPairFactory(ecc);

export class BtcKeypairSigner implements IBtcSigner {
    constructor(
        private readonly nodeProducer: IBtcNodeProducer,
        private readonly wallet: Pick<BtcWalletReadOnly, 'type' | 'address' | 'network'>
    ) {}

    public async sign({ psbt, utxos }: BtcSigningRequest): Promise<Buffer> {
        const bitcoinNetwork = btcNetworkConfig[this.wallet.network];

        const node = await this.nodeProducer.getPortfolioDerivation();

        for (let i = 0; i < utxos.length; i++) {
            const u = utxos[i];
            const privateKey = node
                .deriveChild(u.derivationPath.change)
                .deriveChild(u.derivationPath.addressIndex).privateKey;

            const ecPair = ECPair.fromPrivateKey(privateKey!, { network: bitcoinNetwork });

            psbt.signInput(i, ecPair);

            const valid = psbt.validateSignaturesOfInput(i, (pubkey, msghash, signature) => {
                return ecc.verify(msghash, pubkey, signature);
            });
            if (!valid) throw new Error(`Invalid signature for input ${i}`);
        }

        psbt.finalizeAllInputs();
        return Buffer.from(psbt.extractTransaction().toHex(), 'hex');
    }
}
