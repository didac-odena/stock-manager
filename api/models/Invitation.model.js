import { Schema, model } from "mongoose";

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

const Invitation = model("Invitation", invitationSchema);

export default Invitation;