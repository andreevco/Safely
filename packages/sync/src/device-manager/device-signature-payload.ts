import { u64be, u8be, utf8 } from '../utils/buffer';

export function getAddDeviceSignaturePayload(opts: { ikPub: Buffer; addedAt: number }): Buffer {
    return Buffer.concat([
        utf8(`safely/sync/v1/device/add`),
        Buffer.from([0x00]),
        opts.ikPub,
        u64be(opts.addedAt)
    ]);
}

export function getRevokeDeviceSignaturePayload(opts: { ikPub: Buffer }): Buffer {
    return Buffer.concat([utf8(`safely/sync/v1/device/revoke`), Buffer.from([0x00]), opts.ikPub]);
}

export function getServerAddDeviceSignaturePayload(newIkPub: Buffer): Buffer {
    return Buffer.concat([utf8('safely/sync/v1/server/add_device'), u8be(0x00), newIkPub]);
}

export function getServerRevokeDeviceSignaturePayload(ikPub: Buffer): Buffer {
    return Buffer.concat([utf8('safely/sync/v1/server/revoke_device'), Buffer.from([0x00]), ikPub]);
}
