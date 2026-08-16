import type { FC } from 'react';

import { cx } from '@safely/web-ui/styled-system/css';
import { wordCell } from '@safely/web-ui/styled-system/recipes';

export type WordCellProps = {
    word: string;
    index?: number;
    className?: string;
};

export const WordCell: FC<WordCellProps> = props => {
    const { word, index, className } = props;
    const styles = wordCell();

    return (
        <div className={cx(styles.root, className)}>
            {index === undefined ? (
                <span className={styles.marker}>
                    <span className={styles.dot} />
                </span>
            ) : (
                <span className={styles.marker}>{index}.</span>
            )}

            <span className={styles.word}>{word}</span>
        </div>
    );
};
