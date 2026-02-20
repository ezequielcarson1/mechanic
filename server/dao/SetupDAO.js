const db = require('../db');

class SetupDAO {
    static getProgress(key) {
        return new Promise((resolve, reject) => {
            db.get("SELECT value FROM setup_progress WHERE key = ?", [key], (err, row) => {
                if (err) reject(err);
                else resolve(row ? JSON.parse(row.value) : {});
            });
        });
    }

    static saveProgress(key, value) {
        return new Promise((resolve, reject) => {
            const valueStr = JSON.stringify(value);
            db.run("INSERT OR REPLACE INTO setup_progress (key, value) VALUES (?, ?)", [key, valueStr], function (err) {
                if (err) reject(err);
                else resolve(true);
            });
        });
    }
}

module.exports = SetupDAO;
