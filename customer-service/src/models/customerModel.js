const pool = require('../config/db');

const CustomerModel = {
    // Membuat customer baru
    create: async (userId, name, email, phone, address) => {
        const [result] = await pool.execute(
            `INSERT INTO customers (user_id, name, email, phone, address) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, name, email, phone, address] // ✅ Parameter query ditempatkan di sini
        );
        return result.insertId;
    },

    // Mencari customer berdasarkan ID
    findById: async (id) => {
        const [rows] = await pool.execute(
            'SELECT * FROM customers WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // Mencari customer berdasarkan User ID
    findByUserId: async (userId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM customers WHERE user_id = ?',
            [userId]
        );
        return rows[0];
    },

    // Update data customer
    update: async (id, name, email, phone, address) => {
        const [result] = await pool.execute(
            'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name, email, phone, address, id]
        );
        return result.affectedRows;
    },

    // Hapus customer berdasarkan ID
    delete: async (id) => {
        const [result] = await pool.execute(
            'DELETE FROM customers WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    },

    // Mendapatkan semua customer
    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM customers');
        return rows;
    }
};

module.exports = CustomerModel;
