// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// app.use(express.json());

// Service Routes Mapping
const services = {
    '/api/users': process.env.USER_SERVICE_URL,
    '/api/customers': process.env.CUSTOMER_SERVICE_URL,
    '/api/products': process.env.PRODUCT_SERVICE_URL,
    '/api/transactions': process.env.TRANSACTION_SERVICE_URL
};

// USERS service
if (process.env.USER_SERVICE_URL) {
  app.use('/api/users', createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/(.*)" : "/api/users/$1",
      "^/" : "/api/users/",
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Users Proxy] ${req.method} ${req.originalUrl} → ${proxyReq.path}`);
    }
  }));
}

if (process.env.CUSTOMER_SERVICE_URL) {
    app.use('/api/customers', createProxyMiddleware({
        target: process.env.CUSTOMER_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            "^/(.*)" : "/api/customers/$1",
            "^/" : "/api/customers/",
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Customers Proxy] ${req.method} ${req.originalUrl} → ${proxyReq.path}`);
        }
    }));
}

if (process.env.PRODUCT_SERVICE_URL) {
    app.use('/api/products', createProxyMiddleware({
        target: process.env.PRODUCT_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            "^/(.*)" : "/api/products/$1",
            "^/" : "/api/products/",
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Products Proxy] ${req.method} ${req.originalUrl} → ${proxyReq.path}`);
        }
    }));
}

if (process.env.TRANSACTION_SERVICE_URL) {
    app.use('/api/transactions', createProxyMiddleware({
        target: process.env.TRANSACTION_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            "^/(.*)" : "/api/transactions/$1",
            "^/" : "/api/transactions/",
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Transactions Proxy] ${req.method} ${req.originalUrl} → ${proxyReq.path}`);
        }
    }));
}

Object.entries(services).forEach(([route, target]) => {
    if (target) {
        app.use(route, createProxyMiddleware({ 
            target, 
            changeOrigin: true 
        }));
        console.log(`Proxy enabled: ${route} → ${target}`);
    } else {
        console.warn(`Service URL for ${route} is not defined in .env`);
    }
});


// pathRewrite : {
//     "^/(.*)": "/api/users/$1",
//     "^/" : "/api/users" ,
// }


// onProxyReq: (proxyReq, req, res) => {
//     // You can modify the request here if needed
//     console.log(`Proxying request: ${req.method} ${req.originalUrl}`);


// Health Check / Root Route
app.get('/', (req, res) => {
    res.send('API Gateway for E-commerce Microservices is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
    console.log(`Frontend can access services via http://localhost:${PORT}/api/...`);
});
