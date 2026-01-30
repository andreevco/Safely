import { Cell, List } from '@mobile/shared/ui';

import { styles } from './AddWalletOptions.styles';

export const AddWalletOptions = () => {
    return (
        <List style={styles.list}>
            <List.Group variant="separated">
                <Cell>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>Create new</Cell.Title>
                        </Cell.Row>
                        <Cell.Row>
                            <Cell.Subtitle>Start with a fresh wallet</Cell.Subtitle>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                <Cell>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>Create new</Cell.Title>
                        </Cell.Row>
                        <Cell.Row>
                            <Cell.Subtitle>Start with a fresh wallet</Cell.Subtitle>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                <Cell>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>Create new</Cell.Title>
                        </Cell.Row>
                        <Cell.Row>
                            <Cell.Subtitle>Start with a fresh wallet</Cell.Subtitle>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
            </List.Group>
        </List>
    );
};
