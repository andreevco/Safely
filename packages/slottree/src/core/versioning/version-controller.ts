import { JsonValue } from '../json';
import {
    ContainerSlot,
    createContainerSlot,
    createOriginContainer,
    isContainerSlot,
    Slot
} from '../slots';
import { StorageVersion } from './version';
import { slotFromJson, stripSlot } from '../slots/slot-json';
import { validateSlot } from '../slots/slot-validation';

export type VersionSelector = number | Pick<StorageVersion, 'version'>;
export const DEVICES_KEY = 'devices';

export class VersionController {
    constructor(
        private readonly root: ContainerSlot,
        private readonly versions: readonly StorageVersion[]
    ) {}

    public get(version: VersionSelector): Slot | undefined {
        return this.root.v[this.versionKey(version)];
    }

    public createInitialVersion(): ContainerSlot {
        const latest = this.latestVersion();
        const initial =
            typeof latest.initial === 'function'
                ? (latest.initial as () => unknown)()
                : latest.initial;
        const parsed = latest.schema.parse(initial);
        const slot = slotFromJson(parsed as JsonValue, 0, '');

        if (!isContainerSlot(slot)) {
            throw new Error('Initial version must be a container');
        }

        this.root.v[this.versionKey(latest)] = slot;
        return slot;
    }

    public createVersionFrom(version: VersionSelector): ContainerSlot | undefined {
        const fromIndex = this.versionIndex(version);
        const source = this.get(version);

        if (!isContainerSlot(source)) {
            return undefined;
        }

        let current = source;

        for (let index = fromIndex + 1; index < this.versions.length; index += 1) {
            const toVersion = this.versions[index];
            const projected = toVersion.projectUp(current);
            this.validateProjection(toVersion, projected);
            current = projected;
        }

        this.root.v[this.versionKey(this.latestVersion())] = current;
        return current;
    }

    public delete(version: VersionSelector): void {
        delete this.root.v[this.versionKey(version)];
    }

    public getDeviceVersion(authorId: string): number | undefined {
        const devices = this.root.v[DEVICES_KEY];
        if (!isContainerSlot(devices)) {
            return undefined;
        }

        const device = devices.v[authorId];
        if (!isContainerSlot(device)) {
            return undefined;
        }

        const version = device.v.version;
        if (version?.r === true || version?.d === true) {
            return undefined;
        }

        return typeof version?.v === 'number' ? version.v : undefined;
    }

    public setDeviceVersion(
        authorId: string,
        version: VersionSelector,
        timestamp: number,
        author: string
    ): void {
        const devices = this.devicesContainer();
        const existingDevice = devices.v[authorId];
        const device = isContainerSlot(existingDevice)
            ? existingDevice
            : createContainerSlot(timestamp, author);

        device.v.version = slotFromJson(this.versionNumber(version), timestamp, author);
        devices.v[authorId] = device;
    }

    public deleteVersionsUnusedByDevices(): void {
        const usedVersions = this.usedDeviceVersions();

        for (const version of this.versions) {
            if (!usedVersions.has(version.version)) {
                this.delete(version);
            }
        }
    }

    private latestVersion(): StorageVersion {
        const latest = this.versions[this.versions.length - 1];

        if (latest === undefined) {
            throw new Error('Storage must have at least one version');
        }

        return latest;
    }

    private versionIndex(version: VersionSelector): number {
        const versionNumber = this.versionNumber(version);
        const index = this.versions.findIndex(candidate => candidate.version === versionNumber);

        if (index < 0) {
            throw new Error(`Unknown storage version ${versionNumber}`);
        }

        return index;
    }

    private versionKey(version: VersionSelector): string {
        return String(this.versionNumber(version));
    }

    private versionNumber(version: VersionSelector): number {
        return typeof version === 'number' ? version : version.version;
    }

    private devicesContainer(): ContainerSlot {
        const devices = this.root.v[DEVICES_KEY];

        if (isContainerSlot(devices)) {
            return devices;
        }

        const created = createOriginContainer();
        this.root.v[DEVICES_KEY] = created;
        return created;
    }

    private usedDeviceVersions(): Set<number> {
        const devices = this.root.v[DEVICES_KEY];
        const usedVersions = new Set<number>();

        if (!isContainerSlot(devices)) {
            return usedVersions;
        }

        for (const authorId of Object.keys(devices.v)) {
            const device = devices.v[authorId];

            if (!isContainerSlot(device)) {
                continue;
            }

            const version = device.v.version;

            if (version?.r === true || version?.d === true) {
                continue;
            }

            if (typeof version?.v === 'number') {
                usedVersions.add(version.v);
            }
        }

        return usedVersions;
    }

    private validateProjection(version: StorageVersion, projected: ContainerSlot): void {
        validateSlot(projected);
        version.schema.parse(stripSlot(projected));
    }
}
