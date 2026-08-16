import type { FC } from 'react';
import { useState } from 'react';

import Sliders16 from '@safely/ux/assets/icons/16/sliders-16.svg?react';
import { Badge, Cell, Checkbox, Icon, List, Switch } from '@safely/web-ui';
import { css } from '@safely/web-ui/styled-system/css';

import { ShowcaseSection } from './ShowcaseSection';

const walletDotStyles = css({
    width: '16px',
    height: '16px',
    borderRadius: 'full',
    backgroundColor: 'wallet.blue'
});

export const ListShowcase: FC = () => {
    const [isChecked, setIsChecked] = useState(true);
    const [isEnabled, setIsEnabled] = useState(true);

    return (
        <>
            <ShowcaseSection title="DIVIDED GROUP">
                <List>
                    <List.Title>Section</List.Title>

                    <List.Group>
                        <Cell onClick={() => undefined}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>Label</Cell.Title>
                                    <Cell.Value>Description</Cell.Value>
                                </Cell.Row>
                            </Cell.Content>
                            <Cell.Chevron />
                        </Cell>

                        <Cell>
                            <Cell.Content>
                                <Cell.Title>Label</Cell.Title>
                                <Cell.Subtitle>Description</Cell.Subtitle>
                            </Cell.Content>
                            <Cell.Checkmark />
                        </Cell>

                        <Cell>
                            <Cell.Leading>
                                <span className={walletDotStyles} />
                            </Cell.Leading>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>Wallet</Cell.Title>
                                    <Cell.Value>0.0421 BTC</Cell.Value>
                                </Cell.Row>
                            </Cell.Content>
                            <Cell.Chevron />
                        </Cell>

                        <Cell>
                            <Cell.Leading>
                                <Icon asset={Sliders16} tone="secondary" />
                            </Cell.Leading>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>
                                        Setting <Badge isUppercase>beta</Badge>
                                    </Cell.Title>
                                    <Cell.Value>On</Cell.Value>
                                </Cell.Row>
                            </Cell.Content>
                            <Cell.Trailing>
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={value => setIsEnabled(value)}
                                />
                            </Cell.Trailing>
                        </Cell>

                        <Cell>
                            <Cell.Leading>
                                <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={value => setIsChecked(value)}
                                />
                            </Cell.Leading>
                            <Cell.Content>
                                <Cell.Title>Checkbox left</Cell.Title>
                            </Cell.Content>
                        </Cell>

                        <Cell tone="accentRed" onClick={() => undefined}>
                            <Cell.Content>
                                <Cell.Title>Remove wallet</Cell.Title>
                            </Cell.Content>
                        </Cell>
                    </List.Group>

                    <List.Footer>Groups own the corners and the dividers.</List.Footer>
                </List>
            </ShowcaseSection>

            <ShowcaseSection title="SEPARATED GROUP">
                <List>
                    <List.Group variant="separated">
                        <Cell>
                            <Cell.Content>
                                <Cell.Title>USD</Cell.Title>
                                <Cell.Subtitle>United States Dollar</Cell.Subtitle>
                            </Cell.Content>
                        </Cell>

                        <Cell>
                            <Cell.Content>
                                <Cell.Title>EUR</Cell.Title>
                                <Cell.Subtitle>Euro</Cell.Subtitle>
                            </Cell.Content>
                        </Cell>
                    </List.Group>
                </List>
            </ShowcaseSection>

            <ShowcaseSection title="BADGE, CHECKBOX, SWITCH">
                <div className={css({ display: 'flex', alignItems: 'center', gap: '12' })}>
                    <Badge>neutral</Badge>
                    <Badge tone="accent" isUppercase>
                        accent
                    </Badge>
                    <Badge tone="warning">warning</Badge>
                    <Badge tone="success">success</Badge>
                    <Badge tone="error">error</Badge>
                    <Badge tone="warningFilled">filled</Badge>

                    <Checkbox defaultChecked />
                    <Checkbox />
                    <Checkbox disabled />

                    <Switch defaultChecked />
                    <Switch />
                    <Switch disabled />
                </div>
            </ShowcaseSection>
        </>
    );
};
