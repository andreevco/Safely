import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockNative } = vi.hoisted(() => ({ mockNative: vi.fn() }));

vi.mock('expo-modules-core', () => ({
    requireNativeModule: () => ({ getStoreCountryAsync: mockNative })
}));

import { getStoreCountryAsync } from './index';

beforeEach(() => {
    mockNative.mockReset();
});

describe('getStoreCountryAsync', () => {
    it('uppercases a lowercase native code', async () => {
        mockNative.mockResolvedValue('us');
        expect(await getStoreCountryAsync()).toBe('US');
    });

    it('returns an already-uppercase code unchanged', async () => {
        mockNative.mockResolvedValue('GB');
        expect(await getStoreCountryAsync()).toBe('GB');
    });

    it('returns null when the native module returns null', async () => {
        mockNative.mockResolvedValue(null);
        expect(await getStoreCountryAsync()).toBeNull();
    });
});
