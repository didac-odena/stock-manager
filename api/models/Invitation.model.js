import { Schema, model } from "mongoose";

const INVITATION_EXPIRATION_MS = 60 * 60 * 1000;
const INVITATION_CLEANUP_SECONDS = 24 * 60 * 60;

const invitationSchema = new Schema(
  {
    token: {
      type: String,
      required: [true, "Token is required"],
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + INVITATION_EXPIRATION_MS),
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
      },
    },
  },
);

invitationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: INVITATION_CLEANUP_SECONDS },
);

const Invitation = model("Invitation", invitationSchema);

export default Invitation;
