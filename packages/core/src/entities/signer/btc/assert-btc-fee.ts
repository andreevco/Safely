import type { Transaction } from '@scure/btc-signer';

const MAX_FEE_RATE_SAT_VBYTE = 5000n;

export function assertBtcFeeIsNotAbsurd(psbt: Transaction): void {
    const feeRate = psbt.fee / BigInt(psbt.vsize);

    if (feeRate > MAX_FEE_RATE_SAT_VBYTE) {
        throw new Error(
            `Refusing to sign: fee rate ${feeRate} sat/vB exceeds the ${MAX_FEE_RATE_SAT_VBYTE} sat/vB safety limit`
        );
    }
}
