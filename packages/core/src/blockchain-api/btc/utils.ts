import type { BtcApiUtxo } from '../../api/btc';
import { BtcAssetAmount } from '../../entities/asset/exact-crypto-assets-amounts';
import { isInteger } from '../../utils';

export function getUtxoTotal(utxos: { value: string }[]) {
    return BtcAssetAmount.fromWeiAmount(utxos.reduce((sum, u) => sum + BigInt(u.value), 0n));
}

export function utxoPathToStruct(utxo: BtcApiUtxo) {
    if (!utxo.path) {
        throw new Error(`UTXO ${utxo.txid}:${utxo.vout} has no derivation path`);
    }

    const [_, __, ___, ____, changeS, addressIndexS] = utxo.path.split('/');

    if (!isInteger(changeS) || !isInteger(addressIndexS)) {
        throw new Error(`Unexpected derivation path: ${utxo.path}`);
    }

    const change = parseInt(changeS);
    const addressIndex = parseInt(addressIndexS);

    if (change < 0 || addressIndex < 0) {
        throw new Error(`Unexpected derivation path: ${utxo.path}`);
    }

    return {
        change,
        addressIndex
    };
}
