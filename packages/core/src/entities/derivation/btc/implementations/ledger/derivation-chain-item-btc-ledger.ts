import type { SBtcAccountChainItem } from '@safely/sync-storage';

import { BtcXpub } from '../../../../../blockchain-api';
import type { BtcNetwork } from '../../../../blockchain';
import { btcNetworkByPortfolioNetworkType, BtcWalletType } from '../../../../blockchain';
import type { ILedgerSessionPort } from '../../../../signer';
import { LedgerBtcSigner } from '../../../../signer';
import type { Derivation } from '../../../derivation';
import { BtcWalletId } from '../../btc-wallet-id';
import type { SignableBtcWallet } from '../../I-btc-wallet';
import type { IDerivationChainItemBtc } from '../../I-derivation-chain-item-btc';

export class DerivationChainItemBtcLedger implements IDerivationChainItemBtc {
    public readonly xpub: string;

    public readonly wallets: SignableBtcWallet[];

    public readonly network: BtcNetwork;

    constructor({
        sDerivation,
        masterFingerprint,
        sessionPort,
        derivationRef
    }: {
        sDerivation: SBtcAccountChainItem;
        masterFingerprint: string;
        sessionPort: ILedgerSessionPort;
        derivationRef: Derivation;
    }) {
        this.network = btcNetworkByPortfolioNetworkType(derivationRef.portfolioRef.networkType);
        this.xpub = sDerivation.xpub;

        const walletType = BtcWalletType.NATIVE_SEGWIT;
        const address = BtcXpub.deriveAddress(this.xpub, this.network, walletType);
        const signer = new LedgerBtcSigner(
            {
                accountIndex: derivationRef.index,
                xpub: this.xpub,
                masterFingerprint,
                network: this.network
            },
            sessionPort
        );

        this.wallets = [
            {
                id: new BtcWalletId(derivationRef.id, address),
                type: walletType,
                address,
                network: this.network,
                xpub: this.xpub,
                derivationRef,
                sign(tx) {
                    return signer.sign(tx);
                }
            }
        ];
    }

    public toJSON(): SBtcAccountChainItem {
        return {
            xpub: this.xpub
        };
    }
}
