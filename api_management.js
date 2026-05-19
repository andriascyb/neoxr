/**
 * API Management Module
 * Handles User CRUD operations for the Admin Panel
 */
const express = require('express');

/**
 * @param {import('mysql2/promise').Pool} dbPool 
 * @param {import('node-cache')} apiKeyCache
 * @param {string} ADMIN_KEY
 */
module.exports = function(dbPool, apiKeyCache, ADMIN_KEY) {
    const router = express.Router();
    
    // Middleware to check ADMIN_KEY
    function adminAuth(req, res, next) {
        if (req.query.key !== ADMIN_KEY && req.body.key !== ADMIN_KEY) {
            return res.status(401).json({ status: false, message: 'Unauthorized' });
        }
        next();
    }
    
    // GET /admin/users - List all users
    router.get('/users', adminAuth, async (req, res) => {
        try {
            const [rows] = await dbPool.query("SELECT * FROM api_keys ORDER BY created_at DESC");
            res.json({ status: true, data: rows });
        } catch (err) {
            console.error('[API-MGMT] List Users Error:', err);
            res.status(500).json({ status: false, message: 'Gagal mengambil data user.' });
        }
    });

    // POST /admin/user/save - Add or Update User
    router.post('/user/save', adminAuth, async (req, res) => {
        const { id, api_key, name, balance, is_active, expiry, package_id } = req.body;
        
        try {
            if (id) {
                // Update
                const query = "UPDATE api_keys SET api_key = ?, name = ?, balance = ?, is_active = ?, expiry = ?, expires_at = ?, package_id = ? WHERE id = ?";
                await dbPool.query(query, [api_key, name, balance, is_active, expiry, expiry, package_id || null, id]);
                if (apiKeyCache) apiKeyCache.del(api_key); // Clear cache
                res.json({ status: true, message: 'User berhasil diperbarui.' });
            } else {
                // Create
                const query = "INSERT INTO api_keys (api_key, name, balance, is_active, expiry, expires_at, package_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
                await dbPool.query(query, [api_key, name, balance, is_active, expiry, expiry, package_id || null]);
                res.json({ status: true, message: 'User berhasil ditambahkan.' });
            }
        } catch (err) {
            console.error('[API-MGMT] Save User Error:', err);
            res.status(500).json({ status: false, message: 'Gagal menyimpan data user: ' + err.message });
        }
    });

    // POST /admin/user/delete - Delete User
    router.post('/user/delete', adminAuth, async (req, res) => {
        const { id, api_key } = req.body;
        try {
            await dbPool.query("DELETE FROM api_keys WHERE id = ?", [id]);
            if (apiKeyCache && api_key) apiKeyCache.del(api_key);
            res.json({ status: true, message: 'User berhasil dihapus.' });
        } catch (err) {
            console.error('[API-MGMT] Delete User Error:', err);
            res.status(500).json({ status: false, message: 'Gagal menghapus user.' });
        }
    });

    // POST /admin/user/reset-hits - Reset Hit Counter
    router.post('/user/reset-hits', adminAuth, async (req, res) => {
        const { id, api_key } = req.body;
        try {
            await dbPool.query("UPDATE api_keys SET total_hits = 0 WHERE id = ?", [id]);
            if (apiKeyCache && api_key) apiKeyCache.del(api_key);
            res.json({ status: true, message: 'Hit counter berhasil direset.' });
        } catch (err) {
            console.error('[API-MGMT] Reset Hits Error:', err);
            res.status(500).json({ status: false, message: 'Gagal meriset hit counter.' });
        }
    });

    return router;
};
