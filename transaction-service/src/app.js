// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const app = express();

// Routes
const transactionRoutes = require('./routes/transactionRoutes');

// Middleware
app.use(express.json());

// API Routes
app.use('/api/transactions', transactionRoutes);

// Health Check / Base Route
app.get('/', (req, res) => {
    res.send('Transaction Service API is running');
});

// Server Port
const PORT = process.env.PORT || 3004;

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Transaction Service running on http://localhost:${PORT}`);
});
