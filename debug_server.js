const express = require('express');
const app = express();
const port = 3000;

app.get('/test', (req, res) => {
    console.log('[DEBUG] Received request for /test');
    res.send('OK');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`[DEBUG] Minimal server listening on port ${port}`);
});
