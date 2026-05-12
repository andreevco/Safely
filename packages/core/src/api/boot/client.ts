import type { BootConfig, BootParams } from './models';
import { bootConfigSchema } from './models';
import type { IIdentifiable } from '../../utils';
import { ApiClient } from '../../utils/fetch';

export class BootApi extends ApiClient implements IIdentifiable {
    constructor(private readonly params: BootParams) {
        super('https://config.safely.app/v1');
    }

    public get id() {
        return `${this.constructor.name}:${this.params.build}:${this.params.version}:${this.params.lang}:${this.params.userCountryInfo?.storeCode}:${this.params.userCountryInfo?.storeCode}`;
    }

    private get searchParams() {
        const device_country_code = this.params.userCountryInfo?.deviceCode;
        const store_country_code = this.params.userCountryInfo?.storeCode;

        return {
            lang: this.params.lang,
            platform: this.params.build,
            version: this.params.version,
            ...(device_country_code !== undefined && { device_country_code }),
            ...(store_country_code !== undefined && { store_country_code })
        };
    }

    public async boot(): Promise<BootConfig> {
        return this.getJson('/config', bootConfigSchema, this.searchParams);
    }
}
