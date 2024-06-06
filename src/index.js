const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// REST API to get all products
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// REST API to add a new product
app.post('/api/products', (req, res) => {
    const { name, price, quantity, description } = req.body;
    if (name && price && quantity >= 0) { // Ensure quantity is non-negative
        const stmt = db.prepare('INSERT INTO products (name, price, quantity, description) VALUES (?, ?, ?, ?)');
        stmt.run(name, price, quantity, description, function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const newProduct = { id: this.lastID, name, price, quantity, description };
            broadcast(JSON.stringify({ type: 'new_product', product: newProduct }));
            res.status(201).json(newProduct);
        });
        stmt.finalize();
    } else {
        res.status(400).json({ error: 'Invalid product data' });
    }
});

// REST API to update a product
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, quantity, description } = req.body;
    if (name && price && quantity >= 0) { // Ensure quantity is non-negative
        const stmt = db.prepare('UPDATE products SET name = ?, price = ?, quantity = ?, description = ? WHERE id = ?');
        stmt.run(name, price, quantity, description, id, function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            const updatedProduct = { id: parseInt(id, 10), name, price, quantity, description };
            broadcast(JSON.stringify({ type: 'update_product', product: updatedProduct }));
            res.json(updatedProduct);
        });
        stmt.finalize();
    } else {
        res.status(400).json({ error: 'Invalid product data' });
    }
});

// REST API to delete a product
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        broadcast(JSON.stringify({ type: 'delete_product', productId: parseInt(id, 10) }));
        res.status(204).end();
    });
    stmt.finalize();
});

// Function to broadcast messages to all connected WebSocket clients
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// WebSocket connection handling
wss.on('connection', ws => {
    console.log('New client connected');

    ws.on('message', message => {
        console.log(`Received message => ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
