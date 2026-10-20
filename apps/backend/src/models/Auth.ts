import { Schema, model } from "mongoose";

const authSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required."],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email must be unique"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      validate: {
        validator: async function (value) {
          const user = await this.constructor.findOne({ email: value });

          return !user;
        },
        message: "Email is already in use.",
      },
    },
    googleId: {
      type: String,
      select: false,
    },
    password: {
      type: String,
      required: function (this: { googleId?: string }) {
        return !this.googleId;
      },
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "user"],
        message: "Invalid role type",
      },
      default: "user",
    },
  },
  { timestamps: true, id: true }
);

authSchema.index({ googleId: 1 }, { unique: true, sparse: true });

export const Auth = model("User", authSchema);
