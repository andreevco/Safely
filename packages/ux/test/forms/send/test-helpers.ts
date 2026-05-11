import { vi } from 'vitest';
import { createActor } from 'xstate';

import {
    BTC_ASSET,
    BtcAssetAmount,
    type Contact,
    FiatAsset,
    FiatAssetId,
    NumberFormatter,
    type RatedCryptoAssetAmount,
    Rate,
    toBig,
    WebNumberFormatLocale
} from '@safely/core';
import { Logger } from '@safely/sync';

import { createSendFormMachine } from '../../../src/features/forms/send/machine/machine';
import type { SendFormMachineInput } from '../../../src/features/forms/send/machine/types';
import type {
    ContactSuggestion,
    PortfolioSuggestion
} from '../../../src/features/forms/send/types';
import { computeRecipientMeta } from '../../../src/features/forms/send/utils';
import {
    calculateMaxAmount,
    validateAmount
} from '../../../src/features/forms/send/validators/amount';
import { validateRecipientInput } from '../../../src/features/forms/send/validators/recipient';

export const VALID_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
export const SELF_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
export const SUGGESTION_ADDRESS = 'bc1qcleg3jtmvlar6cgm24vpq6n8ew3d0hame0av83';
export const OTHER_VALID_ADDRESS = 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3';
export const INVALID_ADDRESS = 'not-an-address-x';
export const TOO_SHORT = 'bc';

export const BTC_ASSET_ID = BTC_ASSET.id.toString();

const USD = new FiatAsset(new FiatAssetId('USD'), 'US Dollar');

export function makeMockAsset(): RatedCryptoAssetAmount {
    return {
        amount: BtcAssetAmount.fromRelativeAmount('1.0'),
        price: new Rate(BTC_ASSET, USD, toBig('50000'))
    };
}

export function makeMockFormatter(): NumberFormatter {
    return new NumberFormatter(new WebNumberFormatLocale('en-US'), new Logger());
}

export function makeMaxSendValue(): BtcAssetAmount {
    return BtcAssetAmount.fromRelativeAmount('0.5');
}

export function makePortfolioSuggestion(opts: {
    id: string;
    address: string;
    name?: string;
}): PortfolioSuggestion {
    return {
        id: opts.id,
        address: opts.address,
        meta: { name: opts.name ?? opts.id, icon: { type: 'emoji', value: '🙂' } }
    };
}

export function makeContactSuggestion(opts: {
    id: string;
    address: string;
    name?: string;
}): ContactSuggestion {
    return {
        id: opts.id,
        address: opts.address,
        meta: { name: opts.name ?? opts.id, color: '#1E90FF' }
    };
}

export function makeSuggestions(items: { id: string; address: string }[]): {
    portfolios: PortfolioSuggestion[];
    contacts: ContactSuggestion[];
} {
    return {
        portfolios: items.map(i => makePortfolioSuggestion(i)),
        contacts: []
    };
}

export function startActor(input = makeMockInput()) {
    const actor = createActor(createSendFormMachine(), { input });
    actor.start();

    return actor;
}

export function setupAtAmountIdle(input = makeMockInput()) {
    const actor = startActor(input);
    actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
    actor.send({ type: 'NEXT' });

    return actor;
}

export async function setupAtAmountWithMax(maxValue: BtcAssetAmount, opts: MockInputOptions = {}) {
    const actor = startActor(makeMockInput({ ...opts, fetchMaxValue: async () => maxValue }));
    actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
    actor.send({ type: 'NEXT' });
    await vi.waitFor(() => {
        if (actor.getSnapshot().context.parsed.maxValue === undefined) {
            throw new Error('maxValue not yet set');
        }
    });

    return actor;
}

export function makeMockContact(): Contact {
    return {
        id: { toString: () => 'new-contact-id' },
        addresses: [{ blockchain: 'BTC', address: VALID_ADDRESS }],
        meta: { name: 'Test Contact', color: 'red' }
    } as unknown as Contact;
}

export interface MockInputOptions extends Partial<Omit<SendFormMachineInput, 'shouldResetForm'>> {
    activeWalletAddress?: string;
    portfolioSuggestions?: PortfolioSuggestion[];
    contactSuggestions?: ContactSuggestion[];
    shouldResetForm?: boolean;
}

export function makeMockInput(opts: MockInputOptions = {}): SendFormMachineInput {
    const formatter = opts.formatter ?? makeMockFormatter();
    const activeWalletAddress = opts.activeWalletAddress ?? SELF_ADDRESS;
    const portfolioSuggestions = opts.portfolioSuggestions ?? [];
    const contactSuggestions = opts.contactSuggestions ?? [];
    const asset = makeMockAsset();
    const onSubmit = opts.onSubmit ?? (() => {});
    const createContact = opts.createContact ?? (async () => makeMockContact());
    const shouldResetFormValue = opts.shouldResetForm ?? true;

    return {
        resolvedInitialValues: opts.resolvedInitialValues,
        initialSuggestion: opts.initialSuggestion,
        formatter,
        shouldResetForm: () => shouldResetFormValue,
        onSubmit,
        createContact,
        validateRecipient:
            opts.validateRecipient ??
            ((value, preferredSuggestionId) =>
                validateRecipientInput(value, {
                    activeWalletAddress,
                    portfolioSuggestions,
                    contactSuggestions,
                    preferredSuggestionId
                })),
        validateAmount:
            opts.validateAmount ??
            ((value, inputType, a) => validateAmount(value, inputType, a, formatter)),
        computeMaxAmount:
            opts.computeMaxAmount ??
            ((amount, price, inputType) =>
                calculateMaxAmount({ amount, price }, inputType, formatter)),
        findAssetById:
            opts.findAssetById ??
            (id => (id === asset.amount.asset.id.toString() ? asset : undefined)),
        getRecipientMeta:
            opts.getRecipientMeta ??
            (selectedId =>
                computeRecipientMeta(selectedId, portfolioSuggestions, contactSuggestions)),
        fetchMaxValue: opts.fetchMaxValue ?? (async () => undefined)
    };
}
