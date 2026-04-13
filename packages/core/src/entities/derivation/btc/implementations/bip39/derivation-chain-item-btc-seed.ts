import { BtcBip32NodeProducer } from './btc-bip32-node-producer';
import { BtcXpub } from '../../../../../blockchain-api';
import {
    BtcNetwork,
    btcNetworkByPortfolioNetworkType,
    BtcWalletType,
    VMType
} from '../../../../blockchain';
import { PortfolioNetworkType } from '../../../../portfolio';
import { ISeedProducer } from '../../../../seed/I-seed-producer';
import { BtcKeypairSigner, BtcSigningRequest } from '../../../../signer';
import { Derivation } from '../../../derivation';
import { SBtcAccountChainItem } from '../../../derivation.stored';
import { BtcWalletId } from '../../btc-wallet-id';
import { SignableBtcWallet } from '../../I-btc-wallet';
import { IDerivationChainItemBtc } from '../../I-derivation-chain-item-btc';

export class DerivationChainItemBtcSeed implements IDerivationChainItemBtc {
    public static async getXpub({
        seedProducer,
        walletType,
        network,
        derivationIndex
    }: {
        seedProducer: ISeedProducer;
        walletType: BtcWalletType;
        network: PortfolioNetworkType;
        derivationIndex: number;
    }) {
        const hdKey = await new BtcBip32NodeProducer(
            seedProducer,
            walletType,
            btcNetworkByPortfolioNetworkType(network),
            derivationIndex
        ).getPortfolioDerivation();

        return hdKey.publicExtendedKey;
    }

    public static generate({
        seedProducer,
        xpub,
        derivationIndex,
        derivationRef
    }: {
        seedProducer: ISeedProducer;
        xpub: string;
        derivationIndex: number;
        derivationRef: Derivation;
    }): DerivationChainItemBtcSeed {
        const walletType = BtcWalletType.NATIVE_SEGWIT;

        return new DerivationChainItemBtcSeed({
            derivationRef,
            sDerivation: {
                wallets: [
                    {
                        type: walletType
                    }
                ],
                xpub
            },
            seedProducer,
            derivationIndex
        });
    }

    public readonly xpub: string;

    public readonly wallets: SignableBtcWallet[];

    public readonly network: BtcNetwork;

    private readonly derivationIndex: number;

    constructor({
        sDerivation,
        derivationIndex,
        seedProducer,
        derivationRef
    }: {
        sDerivation: SBtcAccountChainItem;
        derivationIndex: number;
        seedProducer: ISeedProducer;
        derivationRef: Derivation;
    }) {
        this.network = btcNetworkByPortfolioNetworkType(derivationRef.portfolioRef.id.network);
        this.xpub = sDerivation.xpub;
        this.derivationIndex = derivationIndex;

        this.wallets = sDerivation.wallets.map(w => {
            const address = BtcXpub.deriveAddress(this.xpub, this.network, w.type);
            const signer = this.createSigner(seedProducer, { type: w.type, address });

            return {
                id: new BtcWalletId(derivationRef.id, address),
                type: w.type,
                address,
                network: this.network,
                xpub: this.xpub,
                derivationRef,
                sign(tx: BtcSigningRequest) {
                    return signer.sign(tx);
                }
            };
        });
    }

    private createSigner(
        seedProducer: ISeedProducer,
        wallet: Pick<SignableBtcWallet, 'type' | 'address'>
    ) {
        const keypairProducer = new BtcBip32NodeProducer(
            seedProducer,
            wallet.type,
            this.network,
            this.derivationIndex
        );

        return new BtcKeypairSigner(keypairProducer, { ...wallet, network: this.network });
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
