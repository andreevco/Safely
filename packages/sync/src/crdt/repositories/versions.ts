import { YManager } from '../y-manager';

export class VersionsRepository {
    constructor(private readonly yManager: YManager) {}

    public getVersions(): Map<string, string> {
        return new Map(this.yManager.getVersionsMap().entries());
    }

    public async setVersion(device: string, version: string): Promise<void> {
        const versionsMap = this.yManager.getVersionsMap();
        versionsMap.set(device, version);
        await this.yManager.set('versions', versionsMap);
    }

    public async removeVersion(device: string): Promise<void> {
        const versionsMap = this.yManager.getVersionsMap();
        versionsMap.delete(device);
        await this.yManager.set('versions', versionsMap);
    }
}
