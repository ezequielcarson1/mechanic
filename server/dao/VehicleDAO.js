const db = require('../db');

class VehicleDAO {
    static getByUser(userId) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM user_vehicles WHERE userId = ?", [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static create(vehicle) {
        const { id, userId, make, model, color, plate, vin, details } = vehicle;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO user_vehicles (id, userId, make, model, color, plate, vin, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(sql, [id, userId, make, model, color, plate, vin, details], function (err) {
                if (err) reject(err);
                else resolve({ id, ...vehicle });
            });
        });
    }

    static update(id, updates) {
        return new Promise((resolve, reject) => {
            const keys = Object.keys(updates);
            const values = Object.values(updates);
            const setClause = keys.map(key => `${key} = ?`).join(', ');

            const sql = `UPDATE user_vehicles SET ${setClause} WHERE id = ?`;
            db.run(sql, [...values, id], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM user_vehicles WHERE id = ?", [id], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = VehicleDAO;
