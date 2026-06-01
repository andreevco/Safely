import type { About, BootConfig, ConfigParams } from './models';
import { aboutSchema, bootConfigSchema } from './models';
import type { IIdentifiable } from '../../utils';
import { ApiClient } from '../../utils/fetch';

export class ConfigApi extends ApiClient implements IIdentifiable {
    constructor(private readonly params: ConfigParams) {
        super('https://config.safely.app/v1');
    }

    public get id() {
        return `${this.constructor.name}:${this.params.build}:${this.params.version}:${this.params.lang}:${this.params.userCountryInfo?.storeCode}:${this.params.userCountryInfo?.storeCode}:${this.params.devToken ?? ''}`;
    }

    private get searchParams() {
        const dev_token = this.params.devToken;
        const store_country_code = this.params.userCountryInfo?.storeCode;
        const device_country_code = this.params.userCountryInfo?.deviceCode;

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
        return this.getJson('/config', bootConfigSchema, this.searchParams);
    }

    public async getAbout(): Promise<About> {
        return this.getJson('/about', aboutSchema, this.searchParams);
    }
}
