import type { DeviceManagementKit } from '@ledgerhq/device-management-kit';
import { SignerBtcBuilder } from '@ledgerhq/device-signer-kit-bitcoin';

import { awaitDeviceAction } from './await-device-action';
import type { BtcApi } from '../api/btc';
import { BtcXpub } from '../blockchain-api';
import { BtcNetwork, BtcWalletType } from '../entities/blockchain';

export type LedgerAccount = {
    index: number;
    xpub: string;
    address: string;
    balance: bigint;
};

export const discoverLedgerAccounts = async (
    dmk: DeviceManagementKit,
    sessionId: string,
    btcApi: BtcApi,
    startIndex: number,
    count: number
): Promise<LedgerAccount[]> => {
    const bitcoinApp = new SignerBtcBuilder({ dmk, sessionId }).build();
    const accounts: LedgerAccount[] = [];

    for (let index = startIndex; index < startIndex + count; index++) {
        const { extendedPublicKey } = await awaitDeviceAction(
            bitcoinApp.getExtendedPublicKey(`84'/0'/${index}'`, {
                checkOnDevice: false,
                skipOpenApp: true
            })
        );

        const utxos = await btcApi.getUtxos({
            type: BtcWalletType.NATIVE_SEGWIT,
            xpub: extendedPublicKey
        });
        const balance = utxos.reduce((total, utxo) => total + BigInt(utxo.value), 0n);

        accounts.push({
            index,
            xpub: extendedPublicKey,
            balance,
            address: BtcXpub.deriveAddress(
                extendedPublicKey,
                BtcNetwork.MAINNET,
                BtcWalletType.NATIVE_SEGWIT
            )
        });
    }

    return accounts;
};
