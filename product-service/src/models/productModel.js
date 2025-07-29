const pool = require('../config/db');

const ProductModel = {
    // Membuat produk baru
    create: async (name, description, price, stock, imageUrl) => {
        const [result] = await pool.execute(
            'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, stock, imageUrl]
        );
        return result.insertId;
    },

    // Mencari produk berdasarkan ID
    findById: async (id) => {
        const [rows] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // Update produk
    update: async (id, name, description, price, stock, imageUrl) => {
        const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
        if (rows.length === 0) {
            throw new Error(`Product with ID ${id} not found.`);
        }

        const existing = rows[0];
        const updated = {
            name: name ?? existing.name,
            description: description ?? existing.description,
            price: price ?? existing.price,
            stock: stock ?? existing.stock,
            imageUrl: imageUrl ?? existing.image_url,
        };

        return pool.execute(
            'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ? WHERE id = ?',
            [updated.name, updated.description, updated.price, updated.stock, updated.imageUrl, id]
        );
    },

    // Hapus produk berdasarkan ID
    delete: async (id) => {
        const [result] = await pool.execute(
            'DELETE FROM products WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    },

    // Mendapatkan semua produk
    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM products');
        return rows;
    }
};

module.exports = ProductModel;
