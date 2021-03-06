const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const express = require("express");
const { json: bodyParserJson } = require("body-parser");
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const mongoose = require("mongoose");
const multer = require("multer");
const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

// Filefilter for multer
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParserJson());
app.use(multer({ storage, fileFilter }).single("image"));
// Serve static file using experss middleware
app.use("/images", express.static(path.join(__dirname, "images")));
// Set Cors headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  //res.setHeader("Access-Control-Allow-Headers", "Content-Type, XMLHttpRequest");
  next();
});
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);
// Error handling middleware
app.use((error, req, res, next) => {
  console.log(error);
  const { statusCode, message, data } = error;
  res.status(statusCode || 500).json({ message, data });
});
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);
mongoose
  .connect(process.env.MONGODB_MESSAGES_URI)
  .then((result) => {
    const server = app.listen(3090, () =>
      console.log("Express App started!!!")
    );

    // Setup socket.io
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((error) => console.log(error));
