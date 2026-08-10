import { systemPreferences } from 'electron';

/**
 * Stands in for the mobile Keychain's biometric protection. `safeStorage` has no per-item
 * authentication, so the gate lives here and the renderer can only ask for it: a successful
 * prompt mints a short-lived ticket, and secret-store reads require a live one.
 *
 * Where no biometry exists (Windows today) this is unavailable and the secret store stays
 * closed — fail closed. The app passcode, the mobile fallback, comes with the onboarding screens.
 */
const TICKET_TTL_MS = 30_000;

let ticketExpiresAt = 0;

export function isUserPresenceAvailable(): boolean {
    return process.platform === 'darwin' && systemPreferences.canPromptTouchID();
}

export async function promptUserPresence(reason: string): Promise<void> {
    if (!isUserPresenceAvailable()) {
        throw new Error('No user-presence check is available on this platform');
    }

    await systemPreferences.promptTouchID(reason);

    ticketExpiresAt = Date.now() + TICKET_TTL_MS;
}

export function hasValidTicket(): boolean {
    return Date.now() < ticketExpiresAt;
}

export function revokeTicket(): void {
    ticketExpiresAt = 0;
}
