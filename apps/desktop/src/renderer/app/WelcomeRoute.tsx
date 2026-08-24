import type { FC } from 'react';

import { useBootConfig, useLinking, useToast, useTranslate } from '@safely/ux';
import {
    ImportWalletModal,
    MoreOptionsModal,
    PasscodeSetup,
    WatchAccountModal,
    WelcomePage
} from '@safely/web-ui';

import { useOnboardingFlow } from './useOnboardingFlow';

export const WelcomeRoute: FC = () => {
    const t = useTranslate();
    const toast = useToast();
    const onboarding = useOnboardingFlow();
    const { openURL } = useLinking();
    const legal = useBootConfig().references.legal;

    const notSupported = (): void =>
        toast({ message: t('common.errors.notSupportedYet'), type: 'error' });

    return (
        <>
            <WelcomePage
                onCreateWallet={onboarding.startCreate}
                onImportWallet={onboarding.openImport}
                onMoreOptions={onboarding.openMoreOptions}
                onLinkWithQr={notSupported}
                onOpenTerms={() => openURL(legal.terms_url)}
                onOpenPrivacy={() => openURL(legal.privacy_url)}
            />

            {onboarding.step === 'moreOptions' && (
                <MoreOptionsModal
                    onWatchAccount={onboarding.openWatch}
                    onConnectLedger={notSupported}
                    onClose={onboarding.close}
                />
            )}

            {onboarding.step === 'import' && (
                <ImportWalletModal
                    onSubmit={onboarding.onMnemonicReady}
                    onClose={onboarding.close}
                />
            )}

            {onboarding.step === 'watch' && (
                <WatchAccountModal
                    onSubmit={onboarding.onWatchInputReady}
                    onClose={onboarding.close}
                />
            )}

            {onboarding.step === 'passcode' && (
                <PasscodeSetup
                    onComplete={passcode =>
                        void onboarding.onPasscodeComplete(passcode).catch(() => undefined)
                    }
                    onBack={onboarding.goBackFromPasscode}
                />
            )}
        </>
    );
};
