const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const path = require("path");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

const { User, Message, Story } = require("./models/user"); // updated models.js

dotenv.config({ path: "./config.env" });

const app = express();

// Body parsers
app.use(
  bodyParser.json({
    limit: "10mb",
    type: "application/json",
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "10mb",
    type: "application/x-www-form-urlencoded",
  })
);

// CORS
app.use(cors({ origin: "http://localhost:5173" }));

// Static folder for images
app.use("/images", express.static(path.join(__dirname, "public/Images")));

// MongoDB connection
const db = process.env.DATABASE_URL;
mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./public/Images");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  res.send(req.file.filename);
});

// =============== JWT Helpers ===============
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.SECRET);
    const currentUser = await User.findById(decoded.id);
    if (!currentUser)
      return res.status(401).json({ message: "User not found" });

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res
        .status(401)
        .json({ message: "Password recently changed. Please log in again." });
    }
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// =============== Auth Routes ===============
app.post("/signup", async (req, res) => {
  try {
    const user = await User.create(req.body);
    const token = signToken(user._id);
    res.status(201).json({ status: "success", token, user });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res
      .status(400)
      .json({ message: "Please provide userId and password" });
  }

  const user = await User.findOne({ userId }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({ message: "Incorrect userId or password" });
  }

  const token = signToken(user._id);
  res.status(200).json({ status: "success", token, user });
});

// =============== Story Routes ===============
app.post("/stories", protect, async (req, res) => {
  try {
    const story = await Story.create({ ...req.body, author: req.user._id });
    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/stories", async (req, res) => {
  const stories = await Story.find().populate("author", "username email");
  res.status(200).json(stories);
});

// =============== Message Routes ===============
app.post("/messages", protect, async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const msg = await Message.create({
      sender: req.user._id,
      receiver,
      content,
    });
    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/messages/:userId", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .sort("createdAt")
      .populate("sender receiver", "username email");
    res.status(200).json(messages);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Server start
app.listen(3001, () => {
  console.log("🚀 Server running on port 3001");
});
