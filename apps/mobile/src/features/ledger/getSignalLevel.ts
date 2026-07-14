export type SignalLevel = 'weak' | 'medium' | 'strong';

export const getSignalLevel = (rssi: number | null | undefined): SignalLevel => {
    if (rssi == null) {
        return 'weak';
    }

    if (rssi >= -60) {
        return 'strong';
    }

    if (rssi >= -80) {
        return 'medium';
    }

    return 'weak';
};
