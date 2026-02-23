const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/books',        require('./routes/books'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/logs',         require('./routes/logs'));

app.get('/', (req, res) => res.send('Library API is running ✅'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
