const db = require('./server/db');

const id = '297b7d77-695c-41da-86c6-79c5bd504a1b';

console.log('Checking ID:', id);

db.get('SELECT * FROM appointments WHERE id = ?', [id], (err, row) => {
    if (err) {
        console.error('Error query appointments:', err);
    } else {
        console.log('Row found in appointments:', row);
    }
});

db.get('SELECT * FROM assistance_requests WHERE id = ?', [id], (err, row) => {
    if (err) {
        console.error('Error query assistance:', err);
    } else {
        console.log('Row found in assistance_requests:', row);
    }
});
