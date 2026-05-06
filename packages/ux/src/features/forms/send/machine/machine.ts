import * as x from 'xstate';
import { assertEvent, assign } from 'xstate';

import type { BtcAssetAmount, Contact } from '@safely/core';

import { SendFormError } from '../errors';
import { BLOCKCHAIN_DEFAULT_TOKENS, assetIdSchema } from '../utils';
import { actors } from './actors';
import {
    EMPTY_SUGGESTION,
    buildEmptyContext,
    buildInitialContext,
    suggestionFromValidatorResult,
    withResetDependentErrors,
    withResetDependentParsed,
    withResetDependentValues
} from './context';
import { guards } from './guards';
import type { SendFormEvent, SendFormMachineContext, SendFormMachineInput } from './types';
import { reformatForInputType } from '../validators/amount';

export const createSendFormMachine = () =>
    x
        .setup({
            types: {} as {
                events: SendFormEvent;
                context: SendFormMachineContext;
                input: SendFormMachineInput;
            },
            actors,
            guards,
            actions: {
                handleSetRecipient: assign(({ context, event }) => {
                    assertEvent(event, 'SET_RECIPIENT');

                    const recipientChanged = context.values.recipient !== event.value;
                    const baseSuggestion = recipientChanged ? EMPTY_SUGGESTION : context.suggestion;
                    const baseAddressBookName = recipientChanged
                        ? ''
                        : context.values.addressBookName;

                    const result = context.validateRecipient(
                        event.value,
                        baseSuggestion.selectedId
                    );

                    return {
                        values: {
                            ...withResetDependentValues(context.values),
                            recipient: event.value,
                            addressBookName: baseAddressBookName
                        },
                        parsed: {
                            ...withResetDependentParsed(context.parsed),
                            recipient: result.recipient
                        },
                        errors: {
                            ...withResetDependentErrors(context.errors),
                            recipient: result.error
                        },
                        suggestion: suggestionFromValidatorResult(result) ?? baseSuggestion
                    };
                }),
                handleSelectSuggestion: assign(({ context, event }) => {
                    assertEvent(event, 'SELECT_SUGGESTION');

                    const visible = event.visible;
                    const combined = [...visible.portfolios, ...visible.contacts];
                    const picked = combined.find(s => s.id === event.id);

                    if (!picked) return {};

                    const result = context.validateRecipient(picked.address, event.id);

                    const newSuggestion = suggestionFromValidatorResult(result) ?? {
                        selectedId: event.id,
                        contactsIds: visible.contacts.map(s => s.id),
                        portfoliosIds: visible.portfolios.map(s => s.id)
                    };

                    return {
                        values: {
                            ...withResetDependentValues(context.values),
                            recipient: picked.address,
                            addressBookName: ''
                        },
                        parsed: {
                            ...withResetDependentParsed(context.parsed),
                            recipient: result.recipient
                        },
                        errors: {
                            ...withResetDependentErrors(context.errors),
                            recipient: result.error
                        },
                        suggestion: newSuggestion
                    };
                }),
                setAddressBookName: assign(({ context, event }) => {
                    assertEvent(event, 'SET_ADDRESS_BOOK_NAME');

                    return {
                        values: {
                            ...context.values,
                            addressBookName: event.name
                        }
                    };
                }),
                clearSuggestion: assign(() => ({ suggestion: EMPTY_SUGGESTION })),
                handleSetAmount: assign(({ context, event }) => {
                    assertEvent(event, 'SET_AMOUNT');

                    if (event.value === '') {
                        return {
                            values: {
                                ...context.values,
                                amount: '',
                                isMax: false
                            },
                            parsed: {
                                ...context.parsed,
                                amount: undefined
                            },
                            errors: {
                                ...context.errors,
                                amount: undefined
                            }
                        };
                    }

                    const result = context.validateAmount(
                        event.value,
                        context.values.amountInputType,
                        context.parsed.asset
                    );

                    return {
                        values: { ...context.values, amount: result.formatted, isMax: false },
                        parsed: { ...context.parsed, amount: result.parsed },
                        errors: { ...context.errors, amount: result.error }
                    };
                }),
                handleSetAmountInputType: assign(({ context, event }) => {
                    assertEvent(event, 'SET_AMOUNT_INPUT_TYPE');

                    const baseValues = {
                        ...context.values,
                        amountInputType: event.value
                    };
                    const currentParsed = context.parsed.amount;
                    if (!currentParsed?.fiatAssetAmount) {
                        return { values: baseValues };
                    }

                    const result = reformatForInputType(
                        currentParsed,
                        event.value,
                        context.formatter
                    );
                    if (!result) return { values: baseValues };

                    return {
                        values: { ...baseValues, amount: result.formatted },
                        parsed: { ...context.parsed, amount: result.parsed }
                    };
                }),
                handleSetAsset: assign(({ context, event }) => {
                    assertEvent(event, 'SET_ASSET');

                    const zodResult = assetIdSchema.safeParse(event.assetId);
                    if (!zodResult.success) {
                        return {
                            values: { ...context.values, assetId: event.assetId },
                            parsed: { ...context.parsed, asset: undefined },
                            errors: {
                                ...context.errors,
                                asset:
                                    zodResult.error.issues[0]?.message ?? SendFormError.SELECT_TOKEN
                            }
                        };
                    }

                    const parsedAsset = context.findAssetById(zodResult.data);

                    if (!parsedAsset) {
                        return {
                            values: { ...context.values, assetId: event.assetId },
                            parsed: { ...context.parsed, asset: undefined },
                            errors: {
                                ...context.errors,
                                asset: SendFormError.UNABLE_TO_VALIDATE_TOKEN
                            }
                        };
                    }

                    const hadAmount = !!context.parsed.amount;
                    return {
                        values: {
                            ...context.values,
                            assetId: event.assetId,
                            amount: hadAmount ? '' : context.values.amount,
                            isMax: hadAmount ? false : context.values.isMax
                        },
                        parsed: {
                            ...context.parsed,
                            asset: parsedAsset,
                            amount: hadAmount ? undefined : context.parsed.amount
                        },
                        errors: { ...context.errors, asset: undefined }
                    };
                }),
                exitMax: assign(({ context }) => ({
                    values: { ...context.values, isMax: false, amount: '' },
                    parsed: { ...context.parsed, amount: undefined },
                    errors: { ...context.errors, amount: undefined }
                })),
                enterMax: assign(({ context }) => {
                    if (!context.parsed.asset || !context.parsed.maxValue) return {};

                    const result = context.computeMaxAmount(
                        context.parsed.maxValue,
                        context.parsed.asset.price,
                        context.values.amountInputType
                    );
                    if (!result) return {};

                    return {
                        values: { ...context.values, amount: result.formatted, isMax: true },
                        parsed: { ...context.parsed, amount: result.parsed },
                        errors: { ...context.errors, amount: undefined }
                    };
                }),
                assignMaxValue: assign(
                    ({ context }, params: { value: BtcAssetAmount | undefined }) => ({
                        parsed: { ...context.parsed, maxValue: params.value }
                    })
                ),
                assignCreatedContactSuggestion: assign(
                    ({ context }, params: { contact: Contact }) => {
                        const newSuggestionId = params.contact.id.toString();

                        return {
                            values: {
                                ...context.values,
                                addressBookName: ''
                            },
                            suggestion: {
                                selectedId: newSuggestionId,
                                portfoliosIds: context.suggestion.portfoliosIds,
                                contactsIds: [
                                    ...(context.suggestion.contactsIds ?? []),
                                    newSuggestionId
                                ]
                            }
                        };
                    }
                ),
                callOnSubmit: ({ context }) => {
                    const { parsed, suggestion } = context;
                    if (!parsed.recipient || !parsed.amount) return;

                    context.onSubmit(
                        {
                            blockchain: parsed.recipient.blockchain,
                            recipient: parsed.recipient,
                            amount: parsed.amount,
                            isMax: context.values.isMax,
                            recipientMeta: context.getRecipientMeta(suggestion.selectedId)
                        },
                        () => undefined
                    );
                },
                resetAll: assign(({ context }) => buildEmptyContext(context)),
                resolveDefaultAssetForChain: assign(({ context }) => {
                    if (context.parsed.asset) return {};
                    if (!context.parsed.recipient) return {};

                    const defaultAsset =
                        BLOCKCHAIN_DEFAULT_TOKENS[context.parsed.recipient.blockchain];
                    if (!defaultAsset) return {};

                    const ratedAsset = context.findAssetById(defaultAsset.id.toString());
                    if (!ratedAsset) return {};

                    return {
                        parsed: { ...context.parsed, asset: ratedAsset },
                        values: { ...context.values, assetId: defaultAsset.id.toString() }
                    };
                }),
                applyInitialAmountIfNeeded: assign(({ context }) => {
                    if (!context.values.amount) return {};
                    if (!context.parsed.asset) return {};
                    if (context.parsed.amount) return {};
                    if (context.values.isMax) return {};

                    const result = context.validateAmount(
                        context.values.amount,
                        context.values.amountInputType,
                        context.parsed.asset
                    );

                    return {
                        values: { ...context.values, amount: result.formatted },
                        parsed: { ...context.parsed, amount: result.parsed },
                        errors: { ...context.errors, amount: result.error }
                    };
                })
            }
        })
        .createMachine({
            id: 'sendForm',
            initial: 'restoring',
            context: ({ input }) => buildInitialContext(input),
            on: {
                RESET: {
                    actions: 'resetAll',
                    target: '.editing.recipient.empty'
                }
            },
            states: {
                restoring: {
                    always: [
                        {
                            guard: 'isRecipientStepValid',
                            target: 'editing.recipient.valid'
                        },
                        {
                            guard: 'hasSelfTransferError',
                            target: 'editing.recipient.selfTransfer'
                        },
                        {
                            guard: 'hasRecipientError',
                            target: 'editing.recipient.invalid'
                        },
                        {
                            target: 'editing.recipient.empty'
                        }
                    ]
                },
                editing: {
                    initial: 'recipient',
                    states: {
                        recipient: {
                            initial: 'empty',
                            on: {
                                SET_RECIPIENT: {
                                    actions: 'handleSetRecipient',
                                    target: '.routing'
                                },
                                SELECT_SUGGESTION: {
                                    guard: 'isNewSuggestion',
                                    actions: 'handleSelectSuggestion',
                                    target: '.routing'
                                },
                                SET_ADDRESS_BOOK_NAME: {
                                    actions: 'setAddressBookName'
                                },
                                CLEAR_SUGGESTION: {
                                    actions: 'clearSuggestion'
                                }
                            },
                            states: {
                                empty: {},
                                invalid: {},
                                selfTransfer: {},
                                valid: {
                                    invoke: {
                                        src: 'fetchMaxValueActor',
                                        input: ({ context }) => ({
                                            recipient: context.parsed.recipient!,
                                            fetchMaxValue: context.fetchMaxValue
                                        }),
                                        onDone: {
                                            actions: {
                                                type: 'assignMaxValue',
                                                params: ({ event }) => ({ value: event.output })
                                            }
                                        }
                                    },
                                    on: {
                                        NEXT: [
                                            {
                                                guard: 'shouldCreateContact',
                                                target: 'creatingContact'
                                            },
                                            {
                                                guard: 'isRecipientStepValid',
                                                target: '#sendForm.editing.amount'
                                            }
                                        ]
                                    }
                                },
                                creatingContact: {
                                    invoke: {
                                        src: 'createContactActor',
                                        input: ({ context }) => {
                                            const recipient = context.parsed.recipient;
                                            if (!recipient) {
                                                throw new Error(
                                                    'parsed.recipient is required in creatingContact'
                                                );
                                            }

                                            return {
                                                name: context.values.addressBookName.trim(),
                                                blockchain: recipient.blockchain,
                                                address: recipient.address,
                                                createContact: context.createContact
                                            };
                                        },
                                        onDone: {
                                            actions: {
                                                type: 'assignCreatedContactSuggestion',
                                                params: ({ event }) => ({ contact: event.output })
                                            },
                                            target: '#sendForm.editing.amount'
                                        },
                                        onError: {
                                            // TODO: Add action like notification or smth
                                            target: '#sendForm.editing.amount'
                                        }
                                    }
                                },
                                routing: {
                                    always: [
                                        {
                                            guard: 'isRecipientInputEmpty',
                                            target: 'empty'
                                        },
                                        {
                                            guard: 'hasParsedRecipient',
                                            target: 'valid'
                                        },
                                        {
                                            guard: 'hasSelfTransferError',
                                            target: 'selfTransfer'
                                        },
                                        {
                                            guard: 'hasRecipientError',
                                            target: 'invalid'
                                        },
                                        {
                                            target: 'empty'
                                        }
                                    ]
                                }
                            }
                        },
                        amount: {
                            initial: 'idle',
                            entry: 'resolveDefaultAssetForChain',
                            invoke: {
                                src: 'fetchMaxValueActor',
                                input: ({ context }) => ({
                                    recipient: context.parsed.recipient!,
                                    fetchMaxValue: context.fetchMaxValue
                                }),
                                onDone: {
                                    actions: {
                                        type: 'assignMaxValue',
                                        params: ({ event }) => ({ value: event.output })
                                    }
                                }
                            },
                            on: {
                                PREV: {
                                    target: 'recipient.valid'
                                },
                                SET_AMOUNT: {
                                    actions: 'handleSetAmount',
                                    target: '.routing'
                                },
                                SET_AMOUNT_INPUT_TYPE: {
                                    actions: 'handleSetAmountInputType'
                                },
                                ENTER_MAX: {
                                    guard: 'canEnterMax',
                                    target: '.max'
                                }
                            },
                            states: {
                                idle: {
                                    entry: 'applyInitialAmountIfNeeded',
                                    always: [
                                        {
                                            guard: 'shouldRestoreMax',
                                            target: 'max'
                                        },
                                        {
                                            guard: 'isAmountStepValid',
                                            target: 'manual'
                                        }
                                    ],
                                    on: {
                                        SET_ASSET: {
                                            actions: 'handleSetAsset'
                                        }
                                    }
                                },
                                manual: {
                                    on: {
                                        SET_ASSET: {
                                            actions: 'handleSetAsset',
                                            target: 'idle'
                                        },
                                        NEXT: {
                                            guard: 'isAmountStepValid',
                                            target: '#sendForm.submitted'
                                        }
                                    }
                                },
                                invalid: {
                                    on: {
                                        SET_ASSET: {
                                            actions: 'handleSetAsset',
                                            target: 'idle'
                                        }
                                    }
                                },
                                max: {
                                    entry: 'enterMax',
                                    on: {
                                        EXIT_MAX: {
                                            actions: 'exitMax',
                                            target: 'idle'
                                        },
                                        SET_AMOUNT_INPUT_TYPE: {
                                            actions: ['handleSetAmountInputType', 'enterMax']
                                        },
                                        SET_ASSET: {
                                            actions: 'handleSetAsset',
                                            target: 'idle'
                                        },
                                        ENTER_MAX: {},
                                        SET_AMOUNT: [
                                            { guard: 'isAmountValueUnchanged' },
                                            {
                                                guard: 'isAmountValueEmpty',
                                                actions: 'exitMax',
                                                target: 'idle'
                                            },
                                            {
                                                actions: 'handleSetAmount',
                                                target: 'routing'
                                            }
                                        ],
                                        NEXT: {
                                            guard: 'isAmountStepValid',
                                            target: '#sendForm.submitted'
                                        }
                                    }
                                },
                                routing: {
                                    always: [
                                        {
                                            guard: 'isAmountContextEmpty',
                                            target: 'idle'
                                        },
                                        {
                                            guard: 'isAmountStepValid',
                                            target: 'manual'
                                        },
                                        {
                                            target: 'invalid'
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                submitted: {
                    entry: 'callOnSubmit',
                    on: {
                        BACK_TO_EDITING: {
                            target: 'editing.amount'
                        }
                    },
                    always: [
                        {
                            guard: 'shouldResetOnSubmit',
                            actions: 'resetAll',
                            target: 'editing.recipient.empty'
                        }
                    ]
                }
            }
        });
