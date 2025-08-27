// const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
// const UserSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: String,
//       required: false,
//     },
//     desc: {
//       type: String,
//       max: 500,
//     },
//     country: { type: String },
//     state: { type: String },
//     district: { type: String },
//     mandal: { type: String },
//     town: { type: String },
//     catagory: { type: String, default: "nocatagory" },
//     rating: { type: Number, default: 0 },
//     password: { type: String, default: 0 },
//     img: {
//       type: String,
//     },
//   },
//   { timestamps: true }
// );

// UserSchema.pre("save", async function (next) {
//   // Only run this function if password was actually modified
//   if (!this.isModified("password")) return next();

//   // Hash the password with cost of 12
//   this.password = await bcrypt.hash(this.password, 12);

//   // Delete passwordConfirm field
//   this.passwordConfirm = undefined;
//   next();
// });

// UserSchema.methods.correctPassword = async function (
//   candidatePassword,
//   userPassword
// ) {
//   console.log(candidatePassword);
//   console.log(userPassword);
//   const rrr = await bcrypt.compare(candidatePassword, userPassword);
//   console.log(rrr);

//   return rrr;
// };

// UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
//   if (this.passwordChangedAt) {
//     const changedTimestamp = parseInt(
//       this.passwordChangedAt.getTime() / 1000,
//       10
//     );

//     return JWTTimestamp < changedTimestamp;
//   }

//   // False means NOT changed
//   return false;
// };

// module.exports = mongoose.model("User", UserSchema);

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// =====================
// User Schema
// =====================
const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    desc: {
      type: String,
      max: 500,
    },
    country: { type: String },
    state: { type: String },
    district: { type: String },
    mandal: { type: String },
    town: { type: String },
    category: { type: String, default: "nocategory" },
    rating: { type: Number, default: 0 },
    img: {
      type: String,
    },
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// =====================
// Message Schema
// =====================
const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// =====================
// Story Schema
// =====================
const StorySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    script: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: "uncategorized",
    },
    img: {
      type: String, // Poster / cover image
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
  },
  { timestamps: true }
);

// =====================
// Export Models
// =====================
module.exports = {
  User: mongoose.model("User", UserSchema),
  Message: mongoose.model("Message", MessageSchema),
  Story: mongoose.model("Story", StorySchema),
};
