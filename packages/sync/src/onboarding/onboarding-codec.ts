import { TLVReader, TLVWriter } from '../utils/tlv';

const TLV_TYPE = {
    ephemeralPub: 0x01,
    ikPub: 0x02
} as const;

type TLVType = (typeof TLV_TYPE)[keyof typeof TLV_TYPE];

export type OnboardingInvitation = {
    ephemeralPub: Buffer;
    ikPub: Buffer;
};

export class OnboardingInvitationCodec {
    public static encode(payload: OnboardingInvitation): Buffer {
        const writer = new TLVWriter();
        writer.write(TLV_TYPE.ephemeralPub, payload.ephemeralPub);
        writer.write(TLV_TYPE.ikPub, payload.ikPub);
        return writer.concat();
    }

    public static decode(data: Buffer): OnboardingInvitation {
        const reader = new TLVReader(data);
        let ephemeralPub: Buffer | null = null;
        let ikPub: Buffer | null = null;

        let record;
        while ((record = reader.readNext()) !== null) {
            if (!OnboardingInvitationCodec.isSupportedTLV(record.type)) {
                throw new Error('Unknown onboarding invitation TLV type');
            }

            if (record.type === TLV_TYPE.ephemeralPub) {
                ephemeralPub = record.value;
            } else if (record.type === TLV_TYPE.ikPub) {
                ikPub = record.value;
            }
        }

        if (!ephemeralPub || !ikPub) {
            throw new Error('Missing required onboarding invitation TLV fields');
        }

        return { ephemeralPub, ikPub };
    }

    private static isSupportedTLV(type: number): type is TLVType {
        for (const value of Object.values(TLV_TYPE)) {
            if (type === value) {
                return true;
            }
        }
        return false;
    }
}
