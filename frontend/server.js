const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');  // Import CORS


const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON data
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/vistara-news-2', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  country: String,
  agreeToTerms: Boolean,
  saved: {
    type: [
      {
        title: String,
        newsUrl: String,
        category: String,
        description: String,
      }
    ],
    default: [],
  },
  liked: { type: [String], default: [] },
});


// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// User model
const User = mongoose.model('User', userSchema);


// POST route for signup
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, country, agreeToTerms } = req.body;

  if (!agreeToTerms) {
    return res.status(400).json({ message: 'You must agree to the Terms and Conditions.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      country,
      agreeToTerms,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


// POST route for login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }
  
      // Compare entered password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }
  
      res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });
  

  // POST route for Google login
app.post('/google-login', async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        // User not found, you can handle as a new user (e.g., create a new user)
        return res.status(404).json({ message: 'User not found, please sign up.' });
      }
  
      // If the user is found, respond with login success
      res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });

  
// Save Article
app.post('/api/articles/save', async (req, res) => {
  const { title, newsUrl ,category , description, email} = req.body;

  if (!title || !newsUrl || !email || !category || !description) {
    return res.status(400).json({ error: 'Title, newsUrl, category,description and email are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if article already saved
    const alreadySaved = user.saved.some(article => article.newsUrl === newsUrl);
    if (alreadySaved) {
      return res.status(409).json({ message: 'Article already saved' });
    }

    // Push the article to saved array
    user.saved.push({ title, newsUrl ,category , description


      
    });
    await user.save();

    res.status(201).json({ message: 'Article saved to user\'s list successfully' });
  } catch (err) {
    console.error('Error saving article to user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/api/userbasic', async (req, res) => {
  try {
    const rawEmail = req.query.email;
    if (!rawEmail) return res.status(400).json({ error: 'Email is required' });

    const demail = decodeURIComponent(rawEmail);
    console.log(demail)

    const user = await User.findOne({ email:demail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      country: user.country,
    });
  } catch (error) {
    console.error('Error in /api/user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Start server
app.listen(PORT, () => {
  console.log('Server is running on port ${PORT}');
});