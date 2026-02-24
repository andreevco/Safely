import { StyleSheet } from 'react-native-unistyles';

import { Cell } from '@mobile/shared/ui';

export const AssetCellSkeleton = () => {
    return (
        <Cell style={styles.container}>
            <Cell.Skeleton.Image />
            <Cell.Content style={styles.content}>
                <Cell.Row>
                    <Cell.Skeleton.Title />
                    <Cell.Skeleton.Value />
                </Cell.Row>
                <Cell.Row>
                    <Cell.Skeleton.Subtitle />
                    <Cell.Skeleton.Subvalue />
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};

const styles = StyleSheet.create(() => ({
    container: {
        height: 64
    },
    content: {
        gap: 6
    }
}));
