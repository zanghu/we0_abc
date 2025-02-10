import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  githubId: { type: String, unique: true, sparse: true },
  wechatId: { type: String, unique: true, sparse: true },
  token: { type: Number, default: 100000 },
  avatar: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (this: any, next) {
  if (this.isModified("password")) {
    const hashed = await bcrypt.hash(this.password, 10);
    this.password = hashed;
  }
  next();
});

export default mongoose.models.User || mongoose.model("User", userSchema);
