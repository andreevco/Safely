import { Ref, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { CONTACT_NAME_MAX_LENGTH } from '@safely/core';
import { type SendSuggestions } from '@safely/ux';

import { Input } from '@mobile/shared/ui';

import { AddressInput, SuggestionsList } from '../components';
import { styles } from './RecipientStep.styles';
import { useSuggestionSelection } from '../components/SuggestionsList/useSuggestionSelection';

interface RecipientStepProps {
    value: string;
    error: string | undefined;
    onChangeText: (value: string, label?: string) => void;
    inputRef?: Ref<TextInput>;
    suggestions: SendSuggestions;
    restoredSuggestions?: SendSuggestions;
    selectedId?: string;
    isValidAddress: boolean;
    onSelectSuggestion: (id: string, visibleSuggestions: SendSuggestions) => void;
    onClearSuggestionSelection: () => void;
    onSubmitEditing?: () => void;
    onAddressBookNameChange: (name: string) => void;
    addressBookName: string;
}

export const RecipientStep = (props: RecipientStepProps) => {
    const {
        value,
        error,
        inputRef,
        isValidAddress,
        suggestions,
        restoredSuggestions,
        selectedId,
        onChangeText,
        onSelectSuggestion,
        onClearSuggestionSelection,
        onSubmitEditing,
        onAddressBookNameChange,
        addressBookName
    } = props;

    const { t } = useTranslation();

    const { displaySuggestions, handleSelect, handleChangeText } = useSuggestionSelection({
        suggestions,
        restoredSuggestions,
        selectedId,
        onChangeText,
        onSelectSuggestion,
        onClearSuggestionSelection
    });

    const selectedPortfolioMeta = useMemo(
        () => displaySuggestions.portfolios.find(s => s.id === selectedId)?.meta,
        [displaySuggestions, selectedId]
    );
    const selectedContactMeta = useMemo(
        () => displaySuggestions.contacts.find(s => s.id === selectedId)?.meta,
        [displaySuggestions, selectedId]
    );

    return (
        <View style={{ flex: 1 }}>
            <AddressInput
                onSubmitEditing={onSubmitEditing}
                value={value}
                onChangeText={handleChangeText}
                error={error}
                inputRef={inputRef}
                label={t('send.recipient.label')}
                placeholder={t('send.recipient.placeholder')}
                selectedPortfolioMeta={selectedPortfolioMeta}
                selectedContactMeta={selectedContactMeta}
            />
            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bottomOffset={16}
                keyboardDismissMode="on-drag"
            >
                <SuggestionsList
                    suggestions={displaySuggestions}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                />
                {!selectedId && isValidAddress && (
                    <Input>
                        <Input.Label>{t('send.addressBook.label')}</Input.Label>
                        <Input.Field
                            value={addressBookName}
                            onChangeText={onAddressBookNameChange}
                            withClearButton
                            placeholder={t('send.addressBook.placeholder')}
                            maxLength={CONTACT_NAME_MAX_LENGTH}
                        />
                        <Input.Description>{t('send.addressBook.description')}</Input.Description>
                    </Input>
                )}
            </KeyboardAwareScrollView>
        </View>
    );
};
