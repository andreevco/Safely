import type { Logger } from '@safely/sync';

import type { About, BootConfig, ConfigParams } from './models';
import { aboutSchema, bootConfigSchema } from './models';
import type { IIdentifiable } from '../../utils';
import { ApiClient } from '../../utils/fetch';

export class ConfigApi extends ApiClient implements IIdentifiable {
    constructor(
        private readonly params: ConfigParams,
        logger?: Logger
    ) {
        super('https://dev-config.safely.app/v1', {}, logger);
    }

    public get id() {
        return `${this.constructor.name}:${this.params.build}:${this.params.version}:${this.params.lang}:${this.params.devToken ?? ''}`;
    }

    private async getSearchParams() {
        const dev_token = this.params.devToken;
        const userCountryInfo = await this.params.getUserCountryInfo();
        const store_country_code = userCountryInfo.storeCode;
        const device_country_code = userCountryInfo.deviceCode;

        return {
            lang: this.params.lang,
            platform: this.params.build,
            version: this.params.version,
            ...(device_country_code !== undefined && { device_country_code }),
            ...(store_country_code !== undefined && { store_country_code }),
            ...(dev_token && { dev_token })
        };
    }

    public async boot(): Promise<BootConfig> {
        return this.getJson('/config', bootConfigSchema, await this.getSearchParams());
    }

    public async getAbout(): Promise<About> {
        return this.getJson('/about', aboutSchema, await this.getSearchParams());
    }
}
