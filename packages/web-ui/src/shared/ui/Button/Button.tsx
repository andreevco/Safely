import { Button as BaseUiButton } from '@base-ui/react/button';
import type { ComponentPropsWithoutRef, FC } from 'react';

import { cx } from '@safely/web-ui/styled-system/css';
import type { ButtonVariantProps } from '@safely/web-ui/styled-system/recipes';
import { button } from '@safely/web-ui/styled-system/recipes';

export type ButtonProps = Omit<ComponentPropsWithoutRef<typeof BaseUiButton>, 'className'> &
    ButtonVariantProps & {
        /**
         * Base UI also accepts a `(state) => string` callback, which Panda cannot extract —
         * hence a plain string. Style state through the declared conditions instead.
         */
        className?: string;
    };

/* A recipe class name rather than a `styled()` wrapper: without `shouldForwardProp` a wrapper
   leaks style props into the DOM. */
export const Button: FC<ButtonProps> = ({ variant, size, className, ...rest }) => (
    <BaseUiButton className={cx(button({ variant, size }), className)} {...rest} />
);
