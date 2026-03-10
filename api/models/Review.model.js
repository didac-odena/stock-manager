import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: (value) => Number.isInteger(value),
        message: "Rating must be an integer",
      },
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,

    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
      },
    },
  },
);

//Index to prevent multiple reviews from the same email for the same product
reviewSchema.index({ email: 1, product: 1 }, { unique: true });

const Review = model("Review", reviewSchema);

export default Review;