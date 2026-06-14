import type { DeviceManagementKit } from '@ledgerhq/device-management-kit';
import { SignerBtcBuilder } from '@ledgerhq/device-signer-kit-bitcoin';

import { awaitDeviceAction } from './await-device-action';
import { BtcXpub } from '../blockchain-api';
import { BtcNetwork, BtcWalletType } from '../entities/blockchain';
import { BtcWalletId } from '../entities/derivation/btc/btc-wallet-id';
import type { BtcWalletReadOnly } from '../entities/derivation/btc/I-btc-wallet';

export type LedgerAccount = {
    index: number;
    xpub: string;
    address: string;
};

export type DiscoverLedgerAccountsOptions = {
    startIndex?: number;
    count?: number;
};

const LEDGER_DISCOVERY_OWNER = 'ledger-discovery';

export const discoverLedgerAccounts = async (
    dmk: DeviceManagementKit,
    sessionId: string,
    options: DiscoverLedgerAccountsOptions = {}
): Promise<LedgerAccount[]> => {
    const { startIndex = 0, count = 10 } = options;
    const bitcoinApp = new SignerBtcBuilder({ dmk, sessionId }).build();

    // The device is a single serialized APDU pipe — xpubs must be read one at a time.
    const accounts: LedgerAccount[] = [];

    for (let index = startIndex; index < startIndex + count; index++) {
        const { extendedPublicKey } = await awaitDeviceAction(
            bitcoinApp.getExtendedPublicKey(`84'/0'/${index}'`, {
                checkOnDevice: false,
                skipOpenApp: true
            })
        );

        accounts.push({
            index,
            xpub: extendedPublicKey,
            address: BtcXpub.deriveAddress(
                extendedPublicKey,
                BtcNetwork.MAINNET,
                BtcWalletType.NATIVE_SEGWIT
            )
        });
    }

    return accounts;
};

export const ledgerAccountToBtcWallet = (
    account: LedgerAccount,
    network: BtcNetwork
): BtcWalletReadOnly => ({
    id: new BtcWalletId(LEDGER_DISCOVERY_OWNER, account.address),
    type: BtcWalletType.NATIVE_SEGWIT,
    address: account.address,
    network,
    xpub: account.xpub
});
