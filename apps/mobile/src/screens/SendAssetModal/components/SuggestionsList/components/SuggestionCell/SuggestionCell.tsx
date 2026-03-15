import { SendSuggestion } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell } from '@mobile/shared/ui';

import { styles } from './SuggestionCell.styles';

interface SuggestionCellProps {
    suggestion: SendSuggestion;
    showDivider?: boolean;
    onSelect: (address: string, label: string) => void;
}

export const SuggestionCell = (props: SuggestionCellProps) => {
    const { suggestion, showDivider, onSelect } = props;

    return (
        <Cell
            style={styles.cell}
            showDivider={showDivider}
            onPress={() => onSelect(suggestion.address, suggestion.meta.name)}
        >
            <Cell.Content>
                <Cell.Row>
                    <PortfolioName
                        fontVariant="labelL"
                        meta={suggestion.meta}
                        gap={12}
                        size={16}
                        tag={suggestion.tag}
                    />
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
