import type { FC } from 'react';
import { useState } from 'react';

import { useEraseAllData, useSecurityCheck, useTranslate } from '@safely/ux';

import { ChangePasscodeFlow } from './ChangePasscodeFlow';
import { listStyles } from './SettingsSection.styles';
import { useLockScreen } from '../../../entities';
import { EraseDataModal } from '../../../features';
import { Cell, List, PageHeader, Switch } from '../../../shared';

export const SecuritySettings: FC = () => {
    const t = useTranslate();
    const check = useSecurityCheck();
    const { isEnabled, setEnabled } = useLockScreen();
    const { mutateAsync: eraseAllData } = useEraseAllData();

    const [isChangingPasscode, setIsChangingPasscode] = useState(false);
    const [isErasing, setIsErasing] = useState(false);

    const withPasscode = (title: string, onVerified: () => void): void => {
        check({ title }).then(onVerified, () => undefined);
    };

    return (
        <>
            <PageHeader title={t('security.title')} hasDivider />

            <List className={listStyles}>
                <List.Group variant="separated">
                    <Cell>
                        <Cell.Content>
                            <Cell.Title>
                                {t('security.groups.application.lockScreen.title')}
                            </Cell.Title>
                            <Cell.Subtitle>
                                {t('security.groups.application.lockScreen.subtitle')}
                            </Cell.Subtitle>
                        </Cell.Content>
                        <Cell.Trailing>
                            <Switch
                                checked={isEnabled}
                                onCheckedChange={next =>
                                    withPasscode(t('passcode.verify.title'), () => {
                                        void setEnabled(next);
                                    })
                                }
                            />
                        </Cell.Trailing>
                    </Cell>

                    <Cell
                        onClick={() =>
                            withPasscode(t('changePasscode.verify.title'), () =>
                                setIsChangingPasscode(true)
                            )
                        }
                    >
                        <Cell.Content>
                            <Cell.Title>
                                {t('security.groups.application.changePasscode')}
                            </Cell.Title>
                        </Cell.Content>
                        <Cell.Chevron />
                    </Cell>
                </List.Group>

                <List.Group variant="separated">
                    <Cell onClick={() => setIsErasing(true)}>
                        <Cell.Content>
                            <Cell.Title>
                                {t('security.groups.application.eraseAndLogout')}
                            </Cell.Title>
                        </Cell.Content>
                        <Cell.Chevron />
                    </Cell>
                </List.Group>
            </List>

            {isChangingPasscode && (
                <ChangePasscodeFlow onDone={() => setIsChangingPasscode(false)} />
            )}

            {isErasing && (
                <EraseDataModal
                    onConfirm={() => void eraseAllData()}
                    onClose={() => setIsErasing(false)}
                />
            )}
        </>
    );
};
