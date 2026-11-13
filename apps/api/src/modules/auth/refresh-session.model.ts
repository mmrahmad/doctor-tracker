import { model, Schema, type InferSchemaType, type Types } from 'mongoose';

/**
 * One row per issued refresh token. Only an HMAC of the token is stored, so a database leak does
 * not leak usable sessions. All tokens descending from one login share a `familyId`, which lets us
 * revoke the whole chain when a rotated token is replayed (token theft signal).
 */
const refreshSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: 'refresh_sessions' },
);

// MongoDB's TTL monitor deletes sessions once they expire.
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshSessionRecord = InferSchemaType<typeof refreshSessionSchema> & {
  _id: Types.ObjectId;
};
export const RefreshSessionModel = model('RefreshSession', refreshSessionSchema);
