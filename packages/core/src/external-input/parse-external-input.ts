import {
    ParserInvalidAmountError,
    ParserUnrecognizedError,
    ParserUnsupportedSchemeError
} from './errors';
import type { BtcTransferScheme, ExternalInputScheme, ExternalInputSchemeName } from './schemes';
import { BtcAddress } from '../blockchain-api/btc/btc-address';
import { BTC_ASSET } from '../entities/asset/btc-asset';
import { CANONICAL_DECIMAL_REGEX } from '../utils/format/number-formatter';
import { toBig } from '../utils/number';

type Parser = (raw: string) => ExternalInputScheme | null;

function parseBip21Amount(raw: string): string {
    if (!CANONICAL_DECIMAL_REGEX.test(raw)) {
        throw new ParserInvalidAmountError();
    }

    const value = toBig(raw);
    if (value.lte(0) || !value.eq(value.round(BTC_ASSET.decimals, 0))) {
        throw new ParserInvalidAmountError();
    }

    return raw;
}

const parseBip21: Parser = raw => {
    const prefix = 'bitcoin:';
    if (!raw.toLowerCase().startsWith(prefix)) {
        return null;
    }

    const withoutPrefix = raw.slice(prefix.length);
    const [address, queryString] = withoutPrefix.split('?', 2);

    if (!address) {
        return null;
    }

    const network = BtcAddress.validForNetwork(address);

    if (network === null) {
        return null;
    }

    const parsed: BtcTransferScheme['parsed'] = {
        address,
        network
    };

    if (queryString) {
        const params = new URLSearchParams(queryString);

        const amount = params.get('amount');
        if (amount !== null) parsed.amount = parseBip21Amount(amount);

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
    const network = BtcAddress.validForNetwork(trimmed);

    if (network === null) {
        return null;
    }

    return {
        name: 'btc-transfer',
        parsed: {
            address: trimmed,
            network
        }
    };
};

export function parseExternalInput(
    raw: string,
    allowedSchemes?: readonly ExternalInputSchemeName[]
) {
    const parsers: Parser[] = [parseBip21, parseBtcAddress];

    for (const parser of parsers) {
        const scheme = parser(raw);
        if (!scheme) continue;

        if (allowedSchemes && !allowedSchemes.includes(scheme.name)) {
            throw new ParserUnsupportedSchemeError();
        }

        return scheme;
    }

    throw new ParserUnrecognizedError();
}
