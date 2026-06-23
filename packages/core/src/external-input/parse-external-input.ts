import { ParserUnrecognizedError, ParserUnsupportedSchemeError } from './errors';
import type { BtcTransferScheme, ExternalInputScheme, ExternalInputSchemeName } from './schemes';
import { BtcAddress } from '../blockchain-api/btc/btc-address';

type Parser = (raw: string) => ExternalInputScheme | null;

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
