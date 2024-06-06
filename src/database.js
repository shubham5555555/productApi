const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./products.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER DEFAULT 0,
        description TEXT
    )`);

    // Insert sample data if the table is empty
    db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        
        if (row.count === 0) {
            const sampleProducts = [
                { name: 'Product 1', price: 100.0, quantity: 10, description: 'Sample description for Product 1' },
                { name: 'Product 2', price: 200.0, quantity: 20, description: 'Sample description for Product 2' },
                { name: 'Product 3', price: 150.0, quantity: 15, description: 'Sample description for Product 3' },
                { name: 'Product 4', price: 300.0, quantity: 30, description: 'Sample description for Product 4' }
            ];

            const insertStmt = db.prepare("INSERT INTO products (name, price, quantity, description) VALUES (?, ?, ?, ?)");
            sampleProducts.forEach(product => {
                insertStmt.run(product.name, product.price, product.quantity, product.description);
            });
            insertStmt.finalize();
            console.log("Sample data inserted into the products table.");
        }
    });
});

module.exports = db;
