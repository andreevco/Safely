import { PortfolioType } from '@safely/core';
import type { ContactSuggestion, PortfolioSuggestion } from '@safely/ux';

import { ContactCell } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Checkmark28, Icon } from '@mobile/shared/ui';

import { styles } from './SuggestionCell.styles';

type SuggestionCellProps =
    | {
          type: 'portfolio';
          suggestion: PortfolioSuggestion;
          isSelected: boolean;
          showDivider?: boolean;
          onSelect: (id: string) => void;
      }
    | {
          type: 'contact';
          suggestion: ContactSuggestion;
          isSelected: boolean;
          showDivider?: boolean;
          onSelect: (id: string) => void;
      };

export const SuggestionCell = (props: SuggestionCellProps) => {
    const { type, suggestion, isSelected, showDivider, onSelect } = props;

    switch (type) {
        case 'portfolio':
            return (
                <Cell
                    style={styles.cell}
                    showDivider={showDivider}
                    onPress={() => onSelect(suggestion.id)}
                >
                    <Cell.Content>
                        <Cell.Row>
                            <PortfolioName
                                fontVariant="labelL"
                                meta={suggestion.meta}
                                gap={12}
                                size={16}
                                tag={suggestion.tag}
                                type={suggestion.isWatchOnly ? PortfolioType.WATCH_ONLY : undefined}
                                watchOnlyBadgeType="warning"
                            />
                            {isSelected && <Icon icon={Checkmark28} color="accent" />}
                        </Cell.Row>
                    </Cell.Content>
                </Cell>
            );
        case 'contact':
            return (
                <ContactCell
                    meta={suggestion.meta}
                    showDivider={showDivider}
                    isSelected={isSelected}
                    onPress={() => onSelect(suggestion.id)}
                />
            );
    }
};
