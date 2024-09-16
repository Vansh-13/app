const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const cookieParser = require('cookie-parser');
const User = require('./models/user');
const Post = require('./models/post');

require('dotenv').config(); // Load environment variables

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get("/", (req, res) => res.render("index"));
app.get("/login", (req, res) => res.render("login"));
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid email or password.");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Invalid email or password.");

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie("token", token);
    res.redirect("/profile");
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.post("/register", async (req, res) => {
  const { email, password, username, age, name } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send("User already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, name, age, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie("token", token);
    res.redirect("/profile");
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.post("/post", isLogged, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const post = new Post({ user: user._id, content: req.body.content });
    await post.save();

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.get("/profile", isLogged, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("posts");
    res.render("profile", { user });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.get("/like/:id", isLogged, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (!post.likes.includes(req.user.userId)) {
      post.likes.push(req.user.userId);
      await post.save();
    }
    res.redirect("/profile");
  } catch (error) {
    res.status(500).send("Server error");
  }
});

function isLogged(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).redirect("/login");

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data;
    next();
  } catch (error) {
    res.status(401).send("Invalid token");
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
