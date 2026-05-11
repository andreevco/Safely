import { describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';

import {
    BTC_ASSET_ID,
    INVALID_ADDRESS,
    OTHER_VALID_ADDRESS,
    SELF_ADDRESS,
    SUGGESTION_ADDRESS,
    TOO_SHORT,
    VALID_ADDRESS,
    makeContactSuggestion,
    makeMaxSendValue,
    makeMockContact,
    makePortfolioSuggestion,
    makeMockInput,
    makeSuggestions,
    setupAtAmountIdle,
    setupAtAmountWithMax,
    startActor as start
} from './test-helpers';
import { SendFormError } from '../../../src/features/forms/send/errors';
import { createSendFormMachine } from '../../../src/features/forms/send/machine/machine';

describe('sendFormMachine — restoring (initial state)', () => {
    it('lands in editing.recipient.empty when input is fresh', () => {
        const actor = start();
        expect(actor.getSnapshot().matches({ editing: { recipient: 'empty' } })).toBe(true);
    });

    it('lands in editing.recipient.valid when input has valid recipient', () => {
        const actor = start(
            makeMockInput({
                resolvedInitialValues: { recipient: VALID_ADDRESS }
            })
        );
        expect(actor.getSnapshot().matches({ editing: { recipient: 'valid' } })).toBe(true);
        expect(actor.getSnapshot().context.parsed.recipient).toBeDefined();
    });

    it('lands in editing.recipient.selfTransfer when input recipient = active wallet', () => {
        const actor = start(
            makeMockInput({
                resolvedInitialValues: { recipient: SELF_ADDRESS },
                activeWalletAddress: SELF_ADDRESS
            })
        );
        expect(actor.getSnapshot().matches({ editing: { recipient: 'selfTransfer' } })).toBe(true);
    });

    it('lands in editing.recipient.invalid when input recipient is invalid', () => {
        const actor = start(
            makeMockInput({
                resolvedInitialValues: { recipient: INVALID_ADDRESS }
            })
        );
        expect(actor.getSnapshot().matches({ editing: { recipient: 'invalid' } })).toBe(true);
    });

    it('lands in editing.recipient.empty when input recipient is empty string', () => {
        const actor = start(
            makeMockInput({
                resolvedInitialValues: { recipient: '' }
            })
        );
        expect(actor.getSnapshot().matches({ editing: { recipient: 'empty' } })).toBe(true);
    });
});

describe('sendFormMachine — recipient transitions', () => {
    it('SET_RECIPIENT to valid → recipient.valid', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'valid' } })).toBe(true);
        expect(s.context.parsed.recipient).toBeDefined();
        expect(s.context.errors.recipient).toBeUndefined();
    });

    it('SET_RECIPIENT to invalid → recipient.invalid', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: INVALID_ADDRESS });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'invalid' } })).toBe(true);
        expect(s.context.errors.recipient).toBeTruthy();
    });

    it('SET_RECIPIENT to active wallet → recipient.selfTransfer', () => {
        const actor = start(makeMockInput({ activeWalletAddress: SELF_ADDRESS }));
        actor.send({ type: 'SET_RECIPIENT', value: SELF_ADDRESS });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'selfTransfer' } })).toBe(true);
    });

    it('SET_RECIPIENT below MIN_LEN → recipient.empty (silent, no error)', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: TOO_SHORT });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'empty' } })).toBe(true);
        expect(s.context.errors.recipient).toBeUndefined();
    });

    it('SET_RECIPIENT empty from invalid → recipient.empty', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: INVALID_ADDRESS });
        actor.send({ type: 'SET_RECIPIENT', value: '' });

        expect(actor.getSnapshot().matches({ editing: { recipient: 'empty' } })).toBe(true);
    });

    it('SET_RECIPIENT change resets amount/asset/isMax/errors', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'SET_AMOUNT', value: '0.5' });
        const before = actor.getSnapshot();

        expect(before.context.values.amount).toBe('0.5');

        // Go back to recipient step
        actor.send({ type: 'PREV' });
        // Change recipient — should reset dependent fields
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS + 'changed' });
        const after = actor.getSnapshot();

        expect(after.context.values.amount).toBe('');
        expect(after.context.parsed.amount).toBeUndefined();
        expect(after.context.values.isMax).toBe(false);
    });

    it('SELF_TRANSFER blocks NEXT', () => {
        const actor = start(makeMockInput({ activeWalletAddress: SELF_ADDRESS }));
        actor.send({ type: 'SET_RECIPIENT', value: SELF_ADDRESS });
        actor.send({ type: 'NEXT' });

        // should still be in selfTransfer (NEXT not handled)
        expect(actor.getSnapshot().matches({ editing: { recipient: 'selfTransfer' } })).toBe(true);
    });
});

describe('sendFormMachine — recipient → amount transition', () => {
    it('NEXT from valid recipient → editing.amount.idle', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'idle' } })).toBe(true);
    });

    it('PREV from amount.idle → editing.recipient.valid', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'PREV' });

        expect(actor.getSnapshot().matches({ editing: { recipient: 'valid' } })).toBe(true);
    });
});

describe('sendFormMachine — suggestions', () => {
    it('SELECT_SUGGESTION with valid id → recipient.valid + selectedId set', () => {
        const actor = start();
        const visible = makeSuggestions([{ id: 'p1', address: SUGGESTION_ADDRESS }]);
        actor.send({ type: 'SELECT_SUGGESTION', id: 'p1', visible });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'valid' } })).toBe(true);
        expect(s.context.suggestion.selectedId).toBe('p1');
        expect(s.context.values.recipient).toBe(SUGGESTION_ADDRESS);
    });

    it('isNewSuggestion guard: tapping the same suggestion twice is a no-op', () => {
        const actor = start();
        const visible = makeSuggestions([{ id: 'p1', address: SUGGESTION_ADDRESS }]);
        actor.send({ type: 'SELECT_SUGGESTION', id: 'p1', visible });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'SET_AMOUNT', value: '0.5' });
        const before = actor.getSnapshot();

        expect(before.context.values.amount).toBe('0.5');

        actor.send({ type: 'PREV' });
        actor.send({ type: 'SELECT_SUGGESTION', id: 'p1', visible });
        const after = actor.getSnapshot();

        expect(after.context.values.amount).toBe('0.5');
        expect(after.context.suggestion.selectedId).toBe('p1');
    });

    it('SELECT_SUGGESTION with different id but same address → resets dependent fields', () => {
        const actor = start();
        const visible = makeSuggestions([
            { id: 'p1', address: SUGGESTION_ADDRESS },
            { id: 'p2', address: SUGGESTION_ADDRESS }
        ]);
        actor.send({ type: 'SELECT_SUGGESTION', id: 'p1', visible });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'SET_AMOUNT', value: '0.5' });
        actor.send({ type: 'PREV' });

        actor.send({ type: 'SELECT_SUGGESTION', id: 'p2', visible });
        const s = actor.getSnapshot();

        expect(s.context.suggestion.selectedId).toBe('p2');
        expect(s.context.values.amount).toBe('');
        expect(s.context.parsed.amount).toBeUndefined();
    });

    it('SELECT_SUGGESTION on a contact suggestion → recipient.valid + selectedId set', () => {
        const actor = start();
        const visible = {
            portfolios: [],
            contacts: [makeContactSuggestion({ id: 'c1', address: SUGGESTION_ADDRESS })]
        };
        actor.send({ type: 'SELECT_SUGGESTION', id: 'c1', visible });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'valid' } })).toBe(true);
        expect(s.context.suggestion.selectedId).toBe('c1');
        expect(s.context.values.recipient).toBe(SUGGESTION_ADDRESS);
    });

    it('SET_RECIPIENT to a single character after suggestion → recipient.empty, suggestion cleared', () => {
        const actor = start();
        const visible = makeSuggestions([{ id: 'p1', address: SUGGESTION_ADDRESS }]);
        actor.send({ type: 'SELECT_SUGGESTION', id: 'p1', visible });

        expect(actor.getSnapshot().context.suggestion.selectedId).toBe('p1');

        actor.send({ type: 'SET_RECIPIENT', value: 'a' });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'empty' } })).toBe(true);
        expect(s.context.suggestion.selectedId).toBeUndefined();
        expect(s.context.values.recipient).toBe('a');
    });
});

describe('sendFormMachine — addressBookName flow', () => {
    it('SET_ADDRESS_BOOK_NAME updates context only, no state transition', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'SET_ADDRESS_BOOK_NAME', name: 'My Friend' });
        const s = actor.getSnapshot();

        expect(s.context.values.addressBookName).toBe('My Friend');
        expect(s.matches({ editing: { recipient: 'valid' } })).toBe(true);
    });

    it('NEXT with addressBookName + no selected suggestion → creatingContact, then onDone → amount.idle', async () => {
        const createContact = vi.fn().mockResolvedValue(makeMockContact({ name: 'My Friend' }));
        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({
                createContact: createContact as never
            })
        });
        actor.start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'SET_ADDRESS_BOOK_NAME', name: 'My Friend' });
        actor.send({ type: 'NEXT' });
        await new Promise(resolve => setTimeout(resolve, 0));
        const s = actor.getSnapshot();

        expect(createContact).toHaveBeenCalledTimes(1);
        expect(s.matches({ editing: { amount: 'idle' } })).toBe(true);
        expect(s.context.suggestion.selectedId).toBe('new-contact-id');
    });

    it('createContact action pushes the new contact into context.contactSuggestions', async () => {
        const createContact = vi.fn().mockResolvedValue(makeMockContact({ name: 'My Friend' }));
        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({
                createContact: createContact as never
            })
        });
        actor.start();
        expect(actor.getSnapshot().context.contactSuggestions).toHaveLength(0);

        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'SET_ADDRESS_BOOK_NAME', name: 'My Friend' });
        actor.send({ type: 'NEXT' });
        await new Promise(resolve => setTimeout(resolve, 0));

        const s = actor.getSnapshot();
        expect(s.context.contactSuggestions).toHaveLength(1);
        expect(s.context.contactSuggestions[0]).toMatchObject({
            id: 'new-contact-id',
            address: VALID_ADDRESS,
            meta: { name: 'My Friend' }
        });
    });

    it('after createContact, re-entering the same address recognizes the new contact', async () => {
        const createContact = vi.fn().mockResolvedValue(makeMockContact({ name: 'My Friend' }));
        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({
                createContact: createContact as never
            })
        });
        actor.start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'SET_ADDRESS_BOOK_NAME', name: 'My Friend' });
        actor.send({ type: 'NEXT' });
        await new Promise(resolve => setTimeout(resolve, 0));

        actor.send({ type: 'RESET' });
        expect(actor.getSnapshot().context.suggestion.selectedId).toBeUndefined();

        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        expect(actor.getSnapshot().context.suggestion.selectedId).toBe('new-contact-id');
    });
});

describe('sendFormMachine — context snapshots', () => {
    it('portfolioSuggestions/contactSuggestions/activeWallet snapshot from input into context at start', () => {
        const portfolio = makePortfolioSuggestion({ id: 'p1', address: VALID_ADDRESS });
        const contact = makeContactSuggestion({ id: 'c1', address: SUGGESTION_ADDRESS });
        const activeWallet = {
            id: 'active-wallet',
            address: SELF_ADDRESS,
            meta: { name: 'Snapshot Name', icon: { type: 'emoji' as const, value: '🐱' } }
        };
        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({
                portfolioSuggestions: [portfolio],
                contactSuggestions: [contact],
                activeWallet
            })
        });
        actor.start();
        const s = actor.getSnapshot();

        expect(s.context.portfolioSuggestions).toEqual([portfolio]);
        expect(s.context.contactSuggestions).toEqual([contact]);
        expect(s.context.activeWallet).toEqual(activeWallet);
    });
});

describe('sendFormMachine — amount transitions', () => {
    it('SET_AMOUNT valid → amount.manual', () => {
        const actor = setupAtAmountIdle();
        actor.send({ type: 'SET_AMOUNT', value: '0.5' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'manual' } })).toBe(true);
    });

    it('SET_AMOUNT zero → amount.invalid', () => {
        const actor = setupAtAmountIdle();
        actor.send({ type: 'SET_AMOUNT', value: '0' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'invalid' } })).toBe(true);
    });

    it('SET_AMOUNT over balance → amount.invalid (INSUFFICIENT_BALANCE)', () => {
        const actor = setupAtAmountIdle();
        actor.send({ type: 'SET_AMOUNT', value: '2.0' });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { amount: 'invalid' } })).toBe(true);
        expect(s.context.errors.amount).toBe(SendFormError.INSUFFICIENT_BALANCE);
    });

    it('SET_AMOUNT non-numeric → amount.invalid (INVALID_AMOUNT)', () => {
        const actor = setupAtAmountIdle();
        actor.send({ type: 'SET_AMOUNT', value: 'over' });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { amount: 'invalid' } })).toBe(true);
        expect(s.context.errors.amount).toBe(SendFormError.INVALID_AMOUNT);
    });

    it('SET_AMOUNT empty from manual → amount.idle', () => {
        const actor = setupAtAmountIdle();
        actor.send({ type: 'SET_AMOUNT', value: '0.5' });
        actor.send({ type: 'SET_AMOUNT', value: '' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'idle' } })).toBe(true);
    });

    it('amount entry resolves default asset for chain via findAssetById', () => {
        const actor = setupAtAmountIdle();
        const s = actor.getSnapshot();

        expect(s.context.parsed.asset).toBeDefined();
        expect(s.context.values.assetId).toBeTruthy();
    });

    it(
        'amount entry without resolvable default asset leaves parsed.asset undefined (cold-start) ' +
            'when useAsset doesnt return any value yet',
        () => {
            const actor = createActor(createSendFormMachine(), {
                input: makeMockInput({
                    resolvedInitialValues: { recipient: VALID_ADDRESS },
                    ratedAssets: []
                })
            });
            actor.start();
            actor.send({ type: 'NEXT' });
            const s = actor.getSnapshot();

            expect(s.matches({ editing: { amount: 'idle' } })).toBe(true);
            expect(s.context.parsed.asset).toBeUndefined();
        }
    );

    it('ENTER_MAX without maxSendValue → no transition (canEnterMax guard blocks)', () => {
        const actor = setupAtAmountIdle();
        actor.send({ type: 'ENTER_MAX' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'idle' } })).toBe(true);
        expect(actor.getSnapshot().context.values.isMax).toBe(false);
    });

    it('fetchMaxValue resolves then ENTER_MAX → max', async () => {
        const maxValue = makeMaxSendValue();
        const actor = await setupAtAmountWithMax(maxValue);
        actor.send({ type: 'ENTER_MAX' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'max' } })).toBe(true);
        expect(actor.getSnapshot().context.values.amount).toBeTruthy();
        expect(actor.getSnapshot().context.values.isMax).toBe(true);
    });

    it('SET_AMOUNT with same value in max is a no-op', async () => {
        const maxValue = makeMaxSendValue();
        const actor = await setupAtAmountWithMax(maxValue);
        actor.send({ type: 'ENTER_MAX' });
        const before = actor.getSnapshot();

        expect(before.matches({ editing: { amount: 'max' } })).toBe(true);

        actor.send({ type: 'SET_AMOUNT', value: before.context.values.amount });

        expect(actor.getSnapshot().matches({ editing: { amount: 'max' } })).toBe(true);
        expect(actor.getSnapshot().context.values.isMax).toBe(true);
    });

    it('SET_AMOUNT with different value in max → exits to manual', async () => {
        const maxValue = makeMaxSendValue();
        const actor = await setupAtAmountWithMax(maxValue);
        actor.send({ type: 'ENTER_MAX' });
        actor.send({ type: 'SET_AMOUNT', value: '0.123' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'manual' } })).toBe(true);
        expect(actor.getSnapshot().context.values.isMax).toBe(false);
    });

    it('EXIT_MAX then ENTER_MAX recomputes from current maxValue', async () => {
        const maxValue = makeMaxSendValue();
        const actor = await setupAtAmountWithMax(maxValue);

        actor.send({ type: 'ENTER_MAX' });
        const amountAfterFirstMax = actor.getSnapshot().context.values.amount;

        actor.send({ type: 'EXIT_MAX' });
        expect(actor.getSnapshot().context.values.amount).toBe('');
        expect(actor.getSnapshot().context.values.isMax).toBe(false);

        actor.send({ type: 'ENTER_MAX' });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { amount: 'max' } })).toBe(true);
        expect(s.context.values.isMax).toBe(true);
        expect(s.context.values.amount).toBe(amountAfterFirstMax);
    });

    it('PREV from max then NEXT restores max (form navigation preserves MAX)', async () => {
        const maxValue = makeMaxSendValue();
        const actor = await setupAtAmountWithMax(maxValue);
        actor.send({ type: 'ENTER_MAX' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'max' } })).toBe(true);

        actor.send({ type: 'PREV' });
        expect(actor.getSnapshot().matches({ editing: { recipient: 'valid' } })).toBe(true);

        actor.send({ type: 'NEXT' });
        expect(actor.getSnapshot().matches({ editing: { amount: 'max' } })).toBe(true);
    });

    it('PREV from max + recipient change → NEXT goes to idle (recipient change drops MAX)', async () => {
        const maxValue = makeMaxSendValue();
        const actor = await setupAtAmountWithMax(maxValue);
        actor.send({ type: 'ENTER_MAX' });

        actor.send({ type: 'PREV' });
        actor.send({ type: 'SET_RECIPIENT', value: OTHER_VALID_ADDRESS });
        actor.send({ type: 'NEXT' });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { amount: 'idle' } })).toBe(true);
        expect(s.context.values.isMax).toBe(false);
    });
});

describe('sendFormMachine — amount input type', () => {
    it('SET_AMOUNT_INPUT_TYPE updates input type without changing state', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'SET_AMOUNT_INPUT_TYPE', value: 'fiat' });

        const s = actor.getSnapshot();

        expect(s.context.values.amount).toBe('');
        expect(s.context.values.amountInputType).toBe('fiat');
        expect(s.matches({ editing: { amount: 'idle' } })).toBe(true);
    });
});

describe('sendFormMachine — fetchMaxValue actor', () => {
    it('eager prefetch: maxValue resolves while in recipient.valid (before NEXT)', async () => {
        const maxValue = makeMaxSendValue();
        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({ fetchMaxValue: async () => maxValue })
        });
        actor.start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });

        await vi.waitFor(() => {
            if (actor.getSnapshot().context.parsed.maxValue === undefined) {
                throw new Error('maxValue not yet set');
            }
        });

        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'valid' } })).toBe(true);
        expect(s.context.parsed.maxValue).toBe(maxValue);
    });

    it('actor onError → parsed.maxValue stays undefined (canEnterMax remains false)', async () => {
        const fetchMaxValue = vi
            .fn<typeof makeMockInput extends never ? never : () => Promise<undefined>>()
            .mockRejectedValue(new Error('No UTXOs available'));

        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({
                fetchMaxValue: fetchMaxValue as never
            })
        });
        actor.start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });

        await vi.waitFor(() => {
            expect(fetchMaxValue).toHaveBeenCalled();
        });
        await new Promise(resolve => setTimeout(resolve, 0));
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { amount: 'idle' } })).toBe(true);
        expect(s.context.parsed.maxValue).toBeUndefined();

        actor.send({ type: 'ENTER_MAX' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'idle' } })).toBe(true);
    });
});

describe('sendFormMachine — asset selection', () => {
    it('SET_ASSET valid id → updates assetId and resolves parsed.asset', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'SET_ASSET', assetId: BTC_ASSET_ID });

        const s = actor.getSnapshot();

        expect(s.context.values.assetId).toBe(BTC_ASSET_ID);
        expect(s.context.parsed.asset).toBeDefined();
        expect(s.context.errors.asset).toBeUndefined();
    });

    it('SET_ASSET empty → asset error, parsed.asset cleared', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'SET_ASSET', assetId: '' });

        const s = actor.getSnapshot();

        expect(s.context.parsed.asset).toBeUndefined();
        expect(s.context.errors.asset).toBeTruthy();
    });
});

describe('sendFormMachine — submission', () => {
    it('NEXT from amount.manual valid → submitted (calls onSubmit, then resets if shouldResetForm)', () => {
        const onSubmit = vi.fn();
        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({ shouldResetForm: true, onSubmit })
        });
        actor.start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'SET_AMOUNT', value: '0.5' });
        actor.send({ type: 'NEXT' });

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(actor.getSnapshot().matches({ editing: { recipient: 'empty' } })).toBe(true);
    });

    it('shouldResetForm=false stays in submitted', () => {
        const onSubmit = vi.fn();
        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({ shouldResetForm: false, onSubmit })
        });
        actor.start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'SET_AMOUNT', value: '0.5' });
        actor.send({ type: 'NEXT' });

        expect(actor.getSnapshot().matches('submitted')).toBe(true);
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('BACK_TO_EDITING from submitted → editing.amount', () => {
        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({ shouldResetForm: false })
        });
        actor.start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'SET_AMOUNT', value: '0.5' });
        actor.send({ type: 'NEXT' });
        actor.send({ type: 'BACK_TO_EDITING' });

        expect(actor.getSnapshot().matches({ editing: 'amount' })).toBe(true);
    });

    it('submitted carries the amount that was set when ENTER_MAX was pressed', async () => {
        const onSubmit = vi.fn();
        const maxValue = makeMaxSendValue();

        const actor = createActor(createSendFormMachine(), {
            input: makeMockInput({
                resolvedInitialValues: { recipient: VALID_ADDRESS },
                shouldResetForm: false,
                onSubmit,
                fetchMaxValue: async () => maxValue
            })
        });
        actor.start();
        actor.send({ type: 'NEXT' });
        await vi.waitFor(() => {
            if (actor.getSnapshot().context.parsed.maxValue === undefined) {
                throw new Error('maxValue not yet set');
            }
        });
        actor.send({ type: 'ENTER_MAX' });
        const enteredAmount = actor.getSnapshot().context.values.amount;

        expect(enteredAmount).toBeTruthy();

        actor.send({ type: 'NEXT' });

        expect(actor.getSnapshot().matches('submitted')).toBe(true);
        expect(onSubmit).toHaveBeenCalledTimes(1);

        const result = onSubmit.mock.calls[0]?.[0] as {
            amount: { cryptoAssetAmount: { relativeAmount: { eq: (v: unknown) => boolean } } };
        };

        expect(result.amount.cryptoAssetAmount.relativeAmount.eq(maxValue.relativeAmount)).toBe(
            true
        );
    });
});

describe('sendFormMachine — RESET', () => {
    it('RESET from recipient.valid clears recipient and goes to recipient.empty', () => {
        const actor = start();
        actor.send({ type: 'SET_RECIPIENT', value: VALID_ADDRESS });
        actor.send({ type: 'RESET' });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'empty' } })).toBe(true);
        expect(s.context.values.recipient).toBe('');
        expect(s.context.parsed.recipient).toBeUndefined();
    });

    it('RESET from amount.manual clears amount/asset/maxValue', () => {
        const actor = setupAtAmountIdle();
        actor.send({ type: 'SET_AMOUNT', value: '0.5' });
        expect(actor.getSnapshot().matches({ editing: { amount: 'manual' } })).toBe(true);

        actor.send({ type: 'RESET' });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'empty' } })).toBe(true);
        expect(s.context.values.amount).toBe('');
        expect(s.context.values.assetId).toBe('');
        expect(s.context.parsed.amount).toBeUndefined();
        expect(s.context.parsed.asset).toBeUndefined();
        expect(s.context.parsed.maxValue).toBeUndefined();
    });

    it('RESET from amount.max clears isMax and amount', async () => {
        const maxValue = makeMaxSendValue();
        const actor = await setupAtAmountWithMax(maxValue);
        actor.send({ type: 'ENTER_MAX' });

        expect(actor.getSnapshot().matches({ editing: { amount: 'max' } })).toBe(true);
        expect(actor.getSnapshot().context.values.isMax).toBe(true);

        actor.send({ type: 'RESET' });
        const s = actor.getSnapshot();

        expect(s.matches({ editing: { recipient: 'empty' } })).toBe(true);
        expect(s.context.values.isMax).toBe(false);
        expect(s.context.values.amount).toBe('');
        expect(s.context.parsed.maxValue).toBeUndefined();
    });

    it('RESET clears suggestion and addressBookName', () => {
        const actor = start();
        const visible = makeSuggestions([{ id: 'p1', address: SUGGESTION_ADDRESS }]);
        actor.send({ type: 'SELECT_SUGGESTION', id: 'p1', visible });
        actor.send({ type: 'SET_ADDRESS_BOOK_NAME', name: 'Friend' });

        expect(actor.getSnapshot().context.suggestion.selectedId).toBe('p1');

        actor.send({ type: 'RESET' });
        const s = actor.getSnapshot();

        expect(s.context.suggestion.selectedId).toBeUndefined();
        expect(s.context.values.addressBookName).toBe('');
    });
});
