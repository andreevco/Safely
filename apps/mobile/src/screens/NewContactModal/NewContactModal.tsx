import { useNavigation } from '@react-navigation/core';
import type { StaticScreenProps } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'react-native';

import { CONTACT_NAME_MAX_LENGTH } from '@safely/core';
import { useContactForm, useContacts, useDateFormatter } from '@safely/ux';

import { Button, Cell, Input, List, Screen, Text } from '@mobile/shared/ui';

import { styles } from './NewContactModal.styles';

type NewContactModalParams = { contactId?: string } | undefined;

type NewContactModalProps = StaticScreenProps<NewContactModalParams>;

export const NewContactModal = ({ route }: NewContactModalProps) => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    const contactId = route.params?.contactId;
    const contacts = useContacts();

    const dateFormatter = useDateFormatter({
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const initialContact = useMemo(
        () => (contactId ? contacts.find(c => c.id.toString() === contactId) : undefined),
        [contactId, contacts]
    );

    const { state, actions, meta } = useContactForm({
        initialContact,
        onSuccess: () => navigation.goBack()
    });

    const handleSave = useCallback(async () => {
        if (!meta.canSubmit) return;
        Keyboard.dismiss();
        await actions.submit();
    }, [actions, meta.canSubmit]);

    const handleRemove = useCallback(() => {
        if (!initialContact) return;
        navigation.navigate('ConfirmDeleteContactSheet', { contact: initialContact });
    }, [navigation, initialContact]);

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.CloseButton />
                <Screen.Header.Title>
                    {meta.isEditMode ? t('newContact.editTitle') : t('newContact.title')}
                </Screen.Header.Title>
                <Button
                    hitSlop={12}
                    type="primary"
                    size="small"
                    style={styles.button}
                    onPress={handleSave}
                    disabled={!meta.canSubmit}
                >
                    {t('common.save')}
                </Button>
            </Screen.Header>
            <Screen.Content>
                <Input>
                    <Input.Label>{t('newContact.form.name')}</Input.Label>
                    <Input.Field
                        value={state.values.name}
                        onChangeText={actions.setName}
                        errored={!!state.errors.name}
                        placeholder={t('newContact.form.namePlaceholder')}
                        autoFocus={!meta.isEditMode}
                        autoCapitalize="words"
                        maxLength={CONTACT_NAME_MAX_LENGTH}
                        returnKeyType="next"
                        withClearButton
                    />
                    {state.errors.name && (
                        <Input.Description color="accentRed">
                            {t(state.errors.name)}
                        </Input.Description>
                    )}
                </Input>

                {initialContact ? (
                    <>
                        <List.Group style={styles.addressGroup}>
                            <Cell>
                                <Cell.Content>
                                    <Cell.Subtitle>{t('newContact.form.address')}</Cell.Subtitle>
                                    <Cell.Value variant="bodyL" numberOfLines={0}>
                                        {initialContact.addresses[0].address}
                                    </Cell.Value>
                                </Cell.Content>
                            </Cell>
                        </List.Group>

                        <Text variant="bodyM" color="tertiary" style={styles.note}>
                            {t('newContact.form.addressReadonly')}
                        </Text>

                        <Text variant="bodyM" color="tertiary" style={styles.note}>
                            {t('newContact.form.addedOn', {
                                date: dateFormatter.format(initialContact.createdAt)
                            })}
                        </Text>

                        <Text
                            variant="bodyM"
                            color="accentRed"
                            style={styles.note}
                            onPress={handleRemove}
                        >
                            {t('newContact.form.remove')}
                        </Text>
                    </>
                ) : (
                    state.values.addresses.map((address, index) => {
                        const errorKey = state.errors.addresses[index];
                        const errorText = errorKey ? t(errorKey) : undefined;

                        return (
                            <Input key={index}>
                                {index === 0 && (
                                    <Input.Label>{t('newContact.form.address')}</Input.Label>
                                )}
                                <Input.Field
                                    withClearButton
                                    multiline
                                    value={address.value}
                                    onChangeText={value => actions.setAddress(index, value)}
                                    placeholder={t('newContact.form.addressPlaceholder')}
                                    errored={!!errorText}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="done"
                                    onSubmitEditing={meta.canSubmit ? handleSave : undefined}
                                />
                                {errorText && (
                                    <Input.Description color="accentRed">
                                        {errorText}
                                    </Input.Description>
                                )}
                            </Input>
                        );
                    })
                )}
            </Screen.Content>
        </Screen>
    );
};
