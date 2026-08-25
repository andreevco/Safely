import type { FC } from 'react';

import { useTranslate } from '@safely/ux';

import { PasscodeSetupFlow } from './PasscodeSetupFlow';
import { usePasscode } from './usePasscode';

export type ChangePasscodeFlowProps = {
    onDone: () => void;
};

export const ChangePasscodeFlow: FC<ChangePasscodeFlowProps> = ({ onDone }) => {
    const t = useTranslate();
    const { set: setPasscode } = usePasscode();

    return (
        <PasscodeSetupFlow
            create={{ title: t('changePasscode.new.title') }}
            confirm={{ title: t('changePasscode.reenter.title') }}
            onConfirmed={passcode => void setPasscode(passcode).then(onDone)}
            onCancel={onDone}
        />
    );
};
