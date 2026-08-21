import type { FC } from 'react';
import { Fragment } from 'react';

import Plus16 from '@safely/ux/assets/icons/16/plus-16.svg?react';
import type { ButtonProps } from '@safely/web-ui';
import { Button, Icon, Text } from '@safely/web-ui';
import { css } from '@safely/web-ui/styled-system/css';

import { ShowcaseSection, showcaseRowStyles } from './ShowcaseSection';

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

const gridStyles = css({
    display: 'grid',
    gridTemplateColumns: 'auto repeat(6, minmax(0, 1fr))',
    alignItems: 'center',
    gap: '12',
    width: '100%'
});

const headerStyles = css({ paddingBottom: '4' });

const ButtonGrid: FC<{ isDisabled?: boolean }> = props => {
    const { isDisabled } = props;

    return (
        <div className={gridStyles}>
            <span />

            {VARIANTS.map(variant => (
                <Text key={variant} className={headerStyles} variant="labelS" tone="tertiary">
                    {variant}
                </Text>
            ))}

            {SIZES.map(size => (
                <Fragment key={size}>
                    <Text variant="labelS" tone="tertiary">
                        {size}
                    </Text>

                    {VARIANTS.map(variant => (
                        <Button
                            key={variant}
                            variant={variant}
                            size={size}
                            disabled={isDisabled}
                            isFullWidth
                        >
                            Label
                        </Button>
                    ))}
                </Fragment>
            ))}
        </div>
    );
};

export const ButtonShowcase: FC = () => (
    <>
        <ShowcaseSection title="ACTIVE">
            <ButtonGrid />
        </ShowcaseSection>

        <ShowcaseSection title="DISABLED">
            <ButtonGrid isDisabled />
        </ShowcaseSection>

        <ShowcaseSection title="LOADER">
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

        <ShowcaseSection title="ICONS AND WIDTH">
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
