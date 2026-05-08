import { RefObject } from 'react';
import { TextInput, View } from 'react-native';

import type { SendFormView } from '@safely/ux';

import { styles } from './SendAssetModal.styles';
import { RecipientStep } from './steps';
import { useLastSeen } from './useLastSeen';

interface RecipientPagerPageProps {
    view: SendFormView;
    inputRef: RefObject<TextInput | null>;
}

export const RecipientPagerPage = (props: RecipientPagerPageProps) => {
    const { view, inputRef } = props;

    const lastView = useLastSeen(view.state === 'recipient' ? view : null);

    return (
        <View key="recipient" style={styles.page}>
            {lastView && (
                <RecipientStep
                    view={lastView}
                    inputRef={inputRef}
                    onSubmitEditing={'next' in lastView ? lastView.next : undefined}
                />
            )}
        </View>
    );
};
