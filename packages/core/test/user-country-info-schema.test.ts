import { describe, expect, it } from 'vitest';

import { userCountryInfoSchema } from '../src/entities/application/country.schema';

describe('userCountryInfoSchema', () => {
    it('parses a valid UserCountryInfo', () => {
        expect(userCountryInfoSchema.parse({ storeCode: 'US', deviceCode: 'GB' })).toEqual({
            storeCode: 'US',
            deviceCode: 'GB'
        });
    });

    it('rejects when a field is missing', () => {
        expect(() => userCountryInfoSchema.parse({ storeCode: 'US' })).toThrow();
    });
});
