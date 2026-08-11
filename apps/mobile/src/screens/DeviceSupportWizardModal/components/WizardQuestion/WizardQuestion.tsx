import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Cell, List, Text } from '@mobile/shared/ui';

import { styles } from './WizardQuestion.styles';

type WizardQuestionOption<T extends string> = {
    value: T;
    labelKey: string;
};

type WizardQuestionProps<T extends string> = {
    titleKey: string;
    options: readonly WizardQuestionOption<T>[];
    answer: T | null;
    onAnswer: (value: T) => void;
    hasActionBelow?: boolean;
    children?: ReactNode;
};

export const WizardQuestion = <T extends string>(props: WizardQuestionProps<T>) => {
    const { titleKey, options, answer, onAnswer, hasActionBelow, children } = props;

    const { t } = useTranslation();

    styles.useVariants({ hasActionBelow });

    return (
        <List style={styles.container}>
            <Text style={styles.title} variant="bodyL">
                {t(titleKey)}
            </Text>
            <List.Group variant="divided" withoutBottomMargin>
                {options.map(option => (
                    <Cell key={option.value} onPress={() => onAnswer(option.value)}>
                        <Cell.Content>
                            <Cell.Row>
                                <Cell.Title>{t(option.labelKey)}</Cell.Title>
                            </Cell.Row>
                        </Cell.Content>
                        <View style={styles.checkmark}>
                            {answer === option.value && <Cell.Checkmark />}
                        </View>
                    </Cell>
                ))}
            </List.Group>
            {children}
        </List>
    );
};
