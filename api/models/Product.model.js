import { Schema, model } from "mongoose";
import { CATEGORIES } from "../config/categories.config.js";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [1000, "Product description cannot exceed 1000 characters"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      default: 0,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: "A product can have a maximum of 3 images",
      },
    },
    categories: {
      type: [String],
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      default: [],
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
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

//Virtual populate reviews
productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

const Product = model("Product", productSchema);

export default Product;
