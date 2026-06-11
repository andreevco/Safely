import { View } from 'react-native';

import { LogLevel } from '@safely/sync';

import { Chip } from '../Chip';
import { styles } from './LogFilters.styles';

type LogFiltersProps = {
    levels: LogLevel[];
    scopes: string[];
    isLevelActive: (level: LogLevel) => boolean;
    isScopeActive: (scope: string) => boolean;
    onToggleLevel: (level: LogLevel) => void;
    onToggleScope: (scope: string) => void;
};

export const LogFilters = (props: LogFiltersProps) => {
    const { levels, scopes, isLevelActive, isScopeActive, onToggleLevel, onToggleScope } = props;

    return (
        <View style={styles.filters}>
            {levels.length > 0 && (
                <View style={styles.chipRow}>
                    {levels.map(level => (
                        <Chip
                            key={level}
                            label={LogLevel[level]}
                            isActive={isLevelActive(level)}
                            onPress={() => onToggleLevel(level)}
                        />
                    ))}
                </View>
            )}
            {scopes.length > 0 && (
                <View style={styles.chipRow}>
                    {scopes.map(scope => (
                        <Chip
                            key={scope}
                            label={scope}
                            isActive={isScopeActive(scope)}
                            onPress={() => onToggleScope(scope)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};
