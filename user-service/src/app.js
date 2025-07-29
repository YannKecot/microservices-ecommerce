// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const app = express();

// Routes
const userRoutes = require('./routes/userRoutes');

// Middleware
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);

// Health Check / Base Route
app.get('/', (req, res) => {
    res.send('User Service API is running');
});

// Server Port
const PORT = process.env.PORT || 3001;

// Start Server
app.listen(PORT, () => {
    console.log(`✅ User Service running on http://localhost:${PORT}`);
});
