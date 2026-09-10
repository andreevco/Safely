import { describe, expect, it } from 'vitest';

import type { Portfolio } from '../../src';
import {
    buildSubscriptionGroup,
    NotificationSettings,
    PortfolioNetworkType,
    PortfolioWatchOnlyBtc,
    portfolioNotificationTargets,
    WatchOnlySource
} from '../../src';

const XPUB =
    'zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs';
const ADDRESS = 'bc1q5v68nzc6rjgcl8ug0slpx77ucm4spnwzkwkqy2';
const TESTNET_ADDRESS = 'tb1q4tvt7x6veyr96kj3deph5av03czytyw5ssalr6';

function watchOnly(
    id: { xpub: string } | { address: string },
    networkType: PortfolioNetworkType = PortfolioNetworkType.MAINNET
): Portfolio {
    return PortfolioWatchOnlyBtc.create(
        'xpub' in id
            ? { source: WatchOnlySource.XPUB, xpub: id.xpub, networkType }
            : { source: WatchOnlySource.ADDRESS, address: id.address, networkType },
        { name: 'w', icon: { type: 'emoji', value: '🐶' } }
    );
}

describe('portfolioNotificationTargets', () => {
    it('uses xpub for xpub watch-only and address for address watch-only', () => {
        expect(portfolioNotificationTargets(watchOnly({ xpub: XPUB }))).toEqual([XPUB]);
        expect(portfolioNotificationTargets(watchOnly({ address: ADDRESS }))).toEqual([ADDRESS]);
    });

    it('skips testnet portfolios', () => {
        expect(
            portfolioNotificationTargets(
                watchOnly({ address: TESTNET_ADDRESS }, PortfolioNetworkType.TESTNET)
            )
        ).toEqual([]);
    });
});

describe('buildSubscriptionGroup', () => {
    const portfolios = [watchOnly({ xpub: XPUB }), watchOnly({ address: ADDRESS })];

    it('maps default events to received/sent confirmations for all wallets', () => {
        const group = buildSubscriptionGroup(
            NotificationSettings.fromStored(undefined),
            portfolios
        );

        expect(group).toEqual({
            events: [
                { type: 'received', confirmations: 0, targets: [XPUB, ADDRESS] },
                { type: 'received', confirmations: 1, targets: [XPUB, ADDRESS] },
                { type: 'sent', confirmations: 1, targets: [XPUB, ADDRESS] }
            ]
        });
    });

    it('restricts targets to selected portfolios when allWallets is off', () => {
        const settings = NotificationSettings.fromStored({
            allWallets: false,
            portfolioIds: { [portfolios[1].id.toString()]: true },
            events: { receivedDetected: true, receivedConfirmed: false, sentConfirmed: false }
        });

        expect(buildSubscriptionGroup(settings, portfolios)).toEqual({
            events: [{ type: 'received', confirmations: 0, targets: [ADDRESS] }]
        });
    });

    it('returns null when disabled, without targets or without events', () => {
        expect(
            buildSubscriptionGroup(NotificationSettings.fromStored({ enabled: false }), portfolios)
        ).toBeNull();
        expect(
            buildSubscriptionGroup(
                NotificationSettings.fromStored({ allWallets: false, portfolioIds: {} }),
                portfolios
            )
        ).toBeNull();
        expect(
            buildSubscriptionGroup(
                NotificationSettings.fromStored({
                    events: {
                        receivedDetected: false,
                        receivedConfirmed: false,
                        sentConfirmed: false
                    }
                }),
                portfolios
            )
        ).toBeNull();
    });
});
