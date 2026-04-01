import { SendSuggestion } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Checkmark28, Icon } from '@mobile/shared/ui';

import { styles } from './SuggestionCell.styles';

interface SuggestionCellProps {
    suggestion: SendSuggestion;
    isSelected: boolean;
    showDivider?: boolean;
    onSelect: (address: string, label: string) => void;
}

export const SuggestionCell = (props: SuggestionCellProps) => {
    const { suggestion, isSelected, showDivider, onSelect } = props;

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
                        isWatchOnly={suggestion.isWatchOnly}
                        watchOnlyBadgeType="warning"
                    />
                    {isSelected && <Icon icon={Checkmark28} color="accent" />}
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
