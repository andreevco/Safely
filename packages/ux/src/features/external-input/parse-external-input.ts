import { BtcAddress } from '@safely/core';

import {
    BtcTransferScheme,
    ExternalInputResult,
    ExternalInputScheme,
    ExternalInputSchemeName
} from './schemes';

type Parser = (raw: string) => ExternalInputScheme | null;

const parseBip21: Parser = raw => {
    const prefix = 'bitcoin:';
    if (!raw.toLowerCase().startsWith(prefix)) {
        return null;
    }

    const withoutPrefix = raw.slice(prefix.length);
    const [address, queryString] = withoutPrefix.split('?', 2);

    if (!address || !BtcAddress.validate(address)) {
        return null;
    }

    const parsed: BtcTransferScheme['parsed'] = {
        address
    };

    if (queryString) {
        const params = new URLSearchParams(queryString);

        const amount = params.get('amount');
        if (amount) parsed.amount = amount;

        const label = params.get('label');
        if (label) parsed.label = label;

        const message = params.get('message');
        if (message) parsed.message = message;
    }

    return {
        name: 'btc-transfer',
        parsed
    };
};

const parseBtcAddress: Parser = raw => {
    const trimmed = raw.trim();
    if (!BtcAddress.validate(trimmed)) {
        return null;
    }

    return {
        name: 'btc-transfer',
        parsed: {
            address: trimmed
        }
    };
};

export function parseExternalInput(
    raw: string,
    allowedSchemes?: readonly ExternalInputSchemeName[]
): ExternalInputResult {
    const parsers: Parser[] = [parseBip21, parseBtcAddress];

    for (const parser of parsers) {
        const scheme = parser(raw);
        if (!scheme) continue;

        if (allowedSchemes && !allowedSchemes.includes(scheme.name)) {
            return {
                ok: false,
                error: 'externalInput.errors.unsupportedScheme'
            };
        }

        return {
            ok: true,
            scheme
        };
    }

    return {
        ok: false,
        error: 'externalInput.errors.unrecognized'
    };
}
