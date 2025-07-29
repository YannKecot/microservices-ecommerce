const TransactionModel = require('../models/transactionModel');
const axios = require('axios'); // Komunikasi antar service

const TransactionController = {
    // ================= CREATE TRANSACTION =================
    createTransaction: async (req, res) => {
        const { customerId, items } = req.body;

        if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Customer ID and transaction items are required' });
        }

        try {
            // 1. Validasi Customer dengan Customer Service
            const customerResponse = await axios.get(
                `${process.env.CUSTOMER_SERVICE_URL}/api/customers/${customerId}`
            );
            if (customerResponse.status !== 200 || !customerResponse.data) {
                return res.status(404).json({ message: 'Customer not found in Customer Service' });
            }

            let totalAmount = 0;
            const processedItems = [];

            // 2. Validasi Produk dan Kurangi Stok dengan Product Service
            for (const item of items) {
                const productResponse = await axios.get(
                    `${process.env.PRODUCT_SERVICE_URL}/api/products/${item.productId}`
                );
                if (productResponse.status !== 200 || !productResponse.data) {
                    return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
                }

                const product = productResponse.data;
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Not enough stock for product ${product.name}. Available: ${product.stock}`
                    });
                }

                totalAmount += product.price * item.quantity;
                processedItems.push({ productId: product.id, quantity: item.quantity, pricePerItem: product.price });

                // Kurangi stok produk di Product Service
                await axios.put(`${process.env.PRODUCT_SERVICE_URL}/api/products/${product.id}`, {
                    stock: product.stock - item.quantity
                });
            }

            // 3. Buat Transaksi di DB Lokal
            const transactionId = await TransactionModel.createTransaction(customerId, totalAmount, 'pending');

            // 4. Tambahkan Item Transaksi
            for (const item of processedItems) {
                await TransactionModel.addTransactionItem(transactionId, item.productId, item.quantity, item.pricePerItem);
            }

            res.status(201).json({ message: 'Transaction created successfully', transactionId });
        } catch (error) {
            console.error('Error creating transaction:', error.response ? error.response.data : error.message);
            res.status(500).json({ message: 'Error creating transaction', error: error.message });
        }
    },

    // ================= GET TRANSACTION BY ID =================
    getTransactionById: async (req, res) => {
        const { id } = req.params;
        try {
            const transactionItems = await TransactionModel.findById(id);
            if (transactionItems.length === 0) {
                return res.status(404).json({ message: 'Transaction not found' });
            }

            // Ambil detail produk dari Product Service
            const itemsWithProductDetails = await Promise.all(
                transactionItems.map(async (item) => {
                    const productResponse = await axios.get(
                        `${process.env.PRODUCT_SERVICE_URL}/api/products/${item.product_id}`
                    );
                    const product = productResponse.data;
                    return {
                        item_id: item.item_id,
                        product_id: item.product_id,
                        product_name: product ? product.name : 'Unknown Product',
                        quantity: item.quantity,
                        price_per_item: item.price_per_item
                    };
                })
            );

            const transaction = {
                id: transactionItems[0].id,
                customer_id: transactionItems[0].customer_id,
                total_amount: transactionItems[0].total_amount,
                status: transactionItems[0].status,
                transaction_date: transactionItems[0].transaction_date,
                items: itemsWithProductDetails
            };

            res.status(200).json(transaction);
        } catch (error) {
            console.error('Error getting transaction by ID:', error.response ? error.response.data : error.message);
            res.status(500).json({ message: 'Error getting transaction', error: error.message });
        }
    },

    // ================= GET TRANSACTIONS BY CUSTOMER =================
    getTransactionsByCustomerId: async (req, res) => {
        const { customerId } = req.params;
        try {
            const transactionItems = await TransactionModel.findByCustomerId(customerId);
            if (transactionItems.length === 0) {
                return res.status(404).json({ message: 'No transactions found for this customer' });
            }

            // Kelompokkan transaksi
            const transactionsMap = new Map();
            for (const item of transactionItems) {
                if (!transactionsMap.has(item.id)) {
                    transactionsMap.set(item.id, {
                        id: item.id,
                        customer_id: item.customer_id,
                        total_amount: item.total_amount,
                        status: item.status,
                        transaction_date: item.transaction_date,
                        items: []
                    });
                }

                // Ambil detail produk dari Product Service
                const productResponse = await axios.get(
                    `${process.env.PRODUCT_SERVICE_URL}/api/products/${item.product_id}`
                );
                const product = productResponse.data;

                transactionsMap.get(item.id).items.push({
                    item_id: item.item_id,
                    product_id: item.product_id,
                    product_name: product ? product.name : 'Unknown Product',
                    quantity: item.quantity,
                    price_per_item: item.price_per_item
                });
            }

            res.status(200).json(Array.from(transactionsMap.values()));
        } catch (error) {
            console.error('Error getting transactions by customer ID:', error.response ? error.response.data : error.message);
            res.status(500).json({ message: 'Error getting transactions', error: error.message });
        }
    },

    // ================= UPDATE TRANSACTION STATUS =================
    updateTransactionStatus: async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }
        try {
            const affectedRows = await TransactionModel.updateStatus(id, status);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Transaction not found or no changes made' });
            }
            res.status(200).json({ message: 'Transaction status updated successfully' });
        } catch (error) {
            console.error('Error updating transaction status:', error);
            res.status(500).json({ message: 'Error updating transaction status' });
        }
    },

    // ================= DELETE TRANSACTION =================
    deleteTransaction: async (req, res) => {
        const { id } = req.params;
        try {
            const affectedRows = await TransactionModel.delete(id);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Transaction not found' });
            }
            res.status(200).json({ message: 'Transaction deleted successfully' });
        } catch (error) {
            console.error('Error deleting transaction:', error);
            res.status(500).json({ message: 'Error deleting transaction' });
        }
    },

    // ================= GET ALL TRANSACTIONS =================
    getAllTransactions: async (req, res) => {
        try {
            const transactionItems = await TransactionModel.getAll();
            if (transactionItems.length === 0) {
                return res.status(200).json([]);
            }

            const transactionsMap = new Map();
            for (const item of transactionItems) {
                if (!transactionsMap.has(item.id)) {
                    transactionsMap.set(item.id, {
                        id: item.id,
                        customer_id: item.customer_id,
                        total_amount: item.total_amount,
                        status: item.status,
                        transaction_date: item.transaction_date,
                        items: []
                    });
                }

                const productResponse = await axios.get(
                    `${process.env.PRODUCT_SERVICE_URL}/api/products/${item.product_id}`
                );
                const product = productResponse.data;

                transactionsMap.get(item.id).items.push({
                    item_id: item.item_id,
                    product_id: item.product_id,
                    product_name: product ? product.name : 'Unknown Product',
                    quantity: item.quantity,
                    price_per_item: item.price_per_item
                });
            }

            res.status(200).json(Array.from(transactionsMap.values()));
        } catch (error) {
            console.error('Error getting all transactions:', error.response ? error.response.data : error.message);
            res.status(500).json({ message: 'Error getting all transactions', error: error.message });
        }
    }
};

module.exports = TransactionController;
