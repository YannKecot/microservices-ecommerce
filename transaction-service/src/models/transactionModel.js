const pool = require('../config/db');

const TransactionModel = {
    // Membuat transaksi baru
    createTransaction: async (customerId, totalAmount, status = 'pending') => {
        const [result] = await pool.execute(
            'INSERT INTO transactions (customer_id, total_amount, status) VALUES (?, ?, ?)',
            [customerId, totalAmount, status]
        );
        return result.insertId;
    },

    // Menambahkan item ke dalam transaksi
    addTransactionItem: async (transactionId, productId, quantity, pricePerItem) => {
        const [result] = await pool.execute(
            'INSERT INTO transaction_items (transaction_id, product_id, quantity, price_per_item) VALUES (?, ?, ?, ?)',
            [transactionId, productId, quantity, pricePerItem]
        );
        return result.insertId;
    },

    // Cari transaksi berdasarkan ID
    findById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT t.*,
                    ci.id AS item_id, ci.product_id, ci.quantity, ci.price_per_item
             FROM transactions t
             JOIN transaction_items ci ON t.id = ci.transaction_id
             WHERE t.id = ?`,
            [id]
        );
        return rows; // Mengembalikan array karena satu transaksi bisa memiliki banyak item
    },

    // Cari transaksi berdasarkan customer ID
    findByCustomerId: async (customerId) => {
        const [rows] = await pool.execute(
            `SELECT t.*,
                    ci.id AS item_id, ci.product_id, ci.quantity, ci.price_per_item
             FROM transactions t
             JOIN transaction_items ci ON t.id = ci.transaction_id
             WHERE t.customer_id = ?
             ORDER BY t.transaction_date DESC`,
            [customerId]
        );
        return rows;
    },

    // Update status transaksi
    updateStatus: async (id, status) => {
        const [result] = await pool.execute(
            'UPDATE transactions SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows;
    },

    // Hapus transaksi (item akan terhapus via ON DELETE CASCADE)
    delete: async (id) => {
        const [result] = await pool.execute(
            'DELETE FROM transactions WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    },

    // Ambil semua transaksi
    getAll: async () => {
        const [rows] = await pool.execute(
            `SELECT t.*,
                    ci.id AS item_id, ci.product_id, ci.quantity, ci.price_per_item
             FROM transactions t
             JOIN transaction_items ci ON t.id = ci.transaction_id
             ORDER BY t.transaction_date DESC`
        );
        return rows;
    }
};

module.exports = TransactionModel;

/*
Catatan:
- Tidak ada FOREIGN KEY untuk customer_id atau product_id karena data berada di service terpisah.
- Validasi konsistensi dilakukan di controller dengan memanggil Customer Service dan Product Service.
*/
