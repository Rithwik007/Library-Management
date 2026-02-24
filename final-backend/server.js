const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    const Book = require('./models/Book');
    const User = require('./models/User');
    const bookCount = await Book.countDocuments();
    const userCount = await User.countDocuments();
    console.log(`📊 Database Stats: ${bookCount} books, ${userCount} users found.`);
  })
  .catch(err => console.log('❌ MongoDB Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => res.send('Library API is running ✅'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
