// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const app = express();

// Routes
const productRoutes = require('./routes/productRoutes'); // Ganti dari userRoutes ke productRoutes

// Middleware
app.use(express.json());

// API Routes
app.use('/api/products', productRoutes); // Ubah prefix route sesuai fitur

// Health Check / Base Route
app.get('/', (req, res) => {
    res.send('Product Service API is running');
});

// Server Port
const PORT = process.env.PORT || 3003; // Pastikan di .env sudah PORT=3003

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Product Service running on http://localhost:${PORT}`);
});
