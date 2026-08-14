import type { FC } from 'react';

import Plus16 from '@safely/ux/assets/icons/16/plus-16.svg?react';
import type { ButtonProps } from '@safely/web-ui';
import { Button, Icon } from '@safely/web-ui';

import { ShowcaseSection, showcaseColumnStyles, showcaseRowStyles } from './ShowcaseSection';

type ButtonVariant = NonNullable<ButtonProps['variant']>;
type ButtonSize = NonNullable<ButtonProps['size']>;

const VARIANTS: ButtonVariant[] = [
    'primary',
    'secondary',
    'tertiary',
    'overlay',
    'destructive',
    'destructiveOrange'
];

const SIZES: ButtonSize[] = ['small', 'medium', 'large'];

const ButtonRow: FC<{ size: ButtonSize; isDisabled?: boolean }> = props => {
    const { size, isDisabled } = props;

    return (
        <div className={showcaseRowStyles}>
            {VARIANTS.map(variant => (
                <Button key={variant} variant={variant} size={size} disabled={isDisabled}>
                    Label
                </Button>
            ))}
        </div>
    );
};

export const ButtonShowcase: FC = () => (
    <>
        <ShowcaseSection title="BUTTON — ACTIVE">
            <div className={showcaseColumnStyles}>
                {SIZES.map(size => (
                    <ButtonRow key={size} size={size} />
                ))}
            </div>
        </ShowcaseSection>

        <ShowcaseSection title="BUTTON — DISABLED">
            <div className={showcaseColumnStyles}>
                {SIZES.map(size => (
                    <ButtonRow key={size} size={size} isDisabled />
                ))}
            </div>
        </ShowcaseSection>

        <ShowcaseSection title="BUTTON — LOADER">
            <div className={showcaseRowStyles}>
                {SIZES.map(size => (
                    <Button
                        key={size}
                        variant="secondary"
                        size={size}
                        isIconOnly
                        isLoading
                        aria-label={`Loading, ${size}`}
                    />
                ))}

                {SIZES.map(size => (
                    <Button key={`labelled-${size}`} size={size} isLoading>
                        Label
                    </Button>
                ))}
            </div>
        </ShowcaseSection>

        <ShowcaseSection title="BUTTON — ICONS AND WIDTH">
            <div className={showcaseRowStyles}>
                <Button iconLeft={<Icon asset={Plus16} />} size="small">
                    Icon left
                </Button>

                <Button variant="secondary" size="small" iconRight={<Icon asset={Plus16} />}>
                    Icon right
                </Button>

                {SIZES.map(size => (
                    <Button
                        key={size}
                        variant="tertiary"
                        size={size}
                        isIconOnly
                        aria-label={`Add, ${size}`}
                    >
                        <Icon asset={Plus16} />
                    </Button>
                ))}
            </div>

            <Button variant="secondary" size="small" isFullWidth>
                Full width
            </Button>
        </ShowcaseSection>
    </>
);
