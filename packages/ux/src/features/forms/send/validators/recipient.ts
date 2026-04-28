import { RatedCryptoAssetAmount, Recipient } from '@safely/core';

import { SendFormError } from '../errors';
import { ContactSuggestion, PortfolioSuggestion } from '../types';
import {
    BLOCKCHAIN_DEFAULT_TOKENS,
    MIN_RECIPIENT_ADDRESS_LENGTH,
    parseRecipient,
    recipientSchema
} from '../utils';

export interface RecipientValidationResult {
    recipient: Recipient | undefined;
    error: string | undefined;
    asset?: {
        assetId: string;
        asset: RatedCryptoAssetAmount;
    };
    suggestion?: {
        id: string;
        address: string;
        label: string;
        portfoliosIds: string[];
        contactsIds: string[];
    };
}

export function validateRecipientInput(
    value: string,
    context: {
        ratedAssets: RatedCryptoAssetAmount[];
        activeWalletAddress: string;
        portfolioSuggestions: PortfolioSuggestion[];
        contactSuggestions: ContactSuggestion[];
        preferredSuggestionId?: string;
    }
): RecipientValidationResult {
    if (value.trim().length < MIN_RECIPIENT_ADDRESS_LENGTH) {
        return { recipient: undefined, error: undefined };
    }

    const zodResult = recipientSchema.safeParse(value);
    if (!zodResult.success) {
        return {
            recipient: undefined,
            error: zodResult.error.issues[0]?.message ?? SendFormError.INVALID_WALLET_ADDRESS
        };
    }

    const parsedRecipient = parseRecipient(zodResult.data);
    if (typeof parsedRecipient === 'string') {
        return { recipient: undefined, error: parsedRecipient };
    }

    const preferredMatch = context.preferredSuggestionId
        ? [...context.portfolioSuggestions, ...context.contactSuggestions].find(
              s => s.id === context.preferredSuggestionId && s.address === parsedRecipient.address
          )
        : undefined;

    const portfolioMatch =
        preferredMatch ??
        context.portfolioSuggestions.find(s => s.address === parsedRecipient.address);
    const contactMatch = portfolioMatch
        ? undefined
        : context.contactSuggestions.find(s => s.address === parsedRecipient.address);
    const match = portfolioMatch ?? contactMatch;

    const suggestion = match
        ? {
              id: match.id,
              address: parsedRecipient.address,
              label: match.meta.name,
              portfoliosIds: context.portfolioSuggestions.map(s => s.id),
              contactsIds: context.contactSuggestions.map(s => s.id)
          }
        : undefined;

    if (parsedRecipient.address === context.activeWalletAddress) {
        return { recipient: undefined, error: SendFormError.SELF_TRANSFER, suggestion };
    }

    const defaultAsset = BLOCKCHAIN_DEFAULT_TOKENS[parsedRecipient.blockchain];
    const parsedAsset = context.ratedAssets.find(({ amount }) =>
        amount.asset.id.isEq(defaultAsset.id)
    );

    return {
        recipient: parsedRecipient,
        error: undefined,
        asset: parsedAsset
            ? { assetId: defaultAsset.id.toString(), asset: parsedAsset }
            : undefined,
        suggestion
    };
}
