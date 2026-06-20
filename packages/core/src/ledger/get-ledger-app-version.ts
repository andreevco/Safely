import type { DeviceManagementKit } from '@ledgerhq/device-management-kit';
import { GetAppAndVersionCommand, isSuccessCommandResult } from '@ledgerhq/device-management-kit';

export const getLedgerAppVersion = async (
    ledgerKit: DeviceManagementKit,
    sessionId: string
): Promise<string | undefined> => {
    const result = await ledgerKit.sendCommand({
        sessionId,
        command: new GetAppAndVersionCommand()
    });

    return isSuccessCommandResult(result) ? result.data.version : undefined;
};
