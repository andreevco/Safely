import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

import { cx } from '@safely/web-ui/styled-system/css';
import { pageHeader } from '@safely/web-ui/styled-system/recipes';

export type PageHeaderProps = Omit<ComponentPropsWithoutRef<'header'>, 'className' | 'title'> & {
    title: ReactNode;
    actions?: ReactNode;
    hasDivider?: boolean;
    className?: string;
};

export const PageHeader: FC<PageHeaderProps> = props => {
    const { title, actions, hasDivider, className, ...rest } = props;
    const styles = pageHeader({ hasDivider });

    return (
        <header className={cx(styles.root, className)} {...rest}>
            <h1 className={styles.title}>{title}</h1>

            {actions !== undefined && <div className={styles.actions}>{actions}</div>}
        </header>
    );
};
