import {
    BtcNetwork,
    btcNetworkByPortfolioNetworkType,
    BtcWalletType
} from '../../../../blockchain';
import { WatchOnlySigningError } from '../../../../errors';
import type { Derivation } from '../../../derivation';
import type { SBtcAccountChainItem } from '../../../derivation.stored';
import { BtcWalletId } from '../../btc-wallet-id';
import { BtcWallet, IDerivationChainItemBtc } from '../../I-derivation-chain-item-btc';

export class DerivationChainItemBtcAddress implements IDerivationChainItemBtc {
    public static generate(params: {
        address: string;
        derivationRef: Derivation;
    }): DerivationChainItemBtcAddress {
        return new DerivationChainItemBtcAddress(params);
    }

    public readonly xpub = '';

    public readonly wallets: BtcWallet[];

    public readonly network: BtcNetwork;

    constructor(params: { address: string; derivationRef: Derivation }) {
        this.network = btcNetworkByPortfolioNetworkType(
            params.derivationRef.portfolioRef.id.network
        );

        this.wallets = [
            {
                id: new BtcWalletId(params.derivationRef.id, params.address),
                type: BtcWalletType.NATIVE_SEGWIT,
                address: params.address,
                network: this.network,
                xpub: '',
                derivationRef: params.derivationRef,
                sign(): Promise<Buffer> {
                    throw new WatchOnlySigningError();
                }
            }
        ];
    }

    public toJSON(): SBtcAccountChainItem {
        return {
            xpub: this.xpub,
            wallets: this.wallets.map(w => ({
                type: w.type
            }))
        };
    }
}
