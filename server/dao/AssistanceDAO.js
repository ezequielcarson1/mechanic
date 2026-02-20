const db = require('../db');

class AssistanceDAO {
    static create(data) {
        const { id, type, title, car, address, notes, budget, distance, date, userId, status, locationLat, locationLng, photos, vehicleId, zip } = data;
        const newId = id || crypto.randomUUID();

        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO assistance_requests (
                id, type, title, car, address, notes, budget, distance, date, userId, mechanicId, status, 
                locationLat, locationLng, photos, vehicleId, zip
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            db.run(sql, [
                newId,
                type,
                title,
                car,
                address,
                notes,
                budget,
                distance,
                date || new Date().toISOString(),
                userId,
                '', // mechanicId initially empty
                status || 'pending',
                locationLat,
                locationLng,
                photos ? JSON.stringify(photos) : '[]',
                vehicleId,
                zip
            ], function (err) {
                if (err) reject(err);
                else resolve({ id: newId, ...data });
            });
        });
    }

    static getAll(filters = {}) {
        let sql = `
            SELECT ar.*, 
                   u.phone as userPhone, u.name as userName, u.surname as userSurname,
                   m.phone as mechanicPhone, m.name as mechanicName, m.surname as mechanicSurname
            FROM assistance_requests ar
            LEFT JOIN users u ON ar.userId = u.id
            LEFT JOIN users m ON ar.mechanicId = m.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.userId) {
            sql += " AND ar.userId = ?";
            params.push(filters.userId);
        }
        if (filters.mechanicId) {
            sql += " AND ar.mechanicId = ?";
            params.push(filters.mechanicId);
        }
        if (filters.status) {
            sql += " AND ar.status = ?";
            params.push(filters.status);
        }
        if (filters.zip) {
            sql += " AND zip = ?";
            params.push(filters.zip);
        }

        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM assistance_requests WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static updateStatus(id, mechanicId, status) {
        return new Promise((resolve, reject) => {
            db.run(
                "UPDATE assistance_requests SET mechanicId = ?, status = ? WHERE id = ?",
                [mechanicId, status, id],
                function (err) {
                    if (err) reject(err);
                    else resolve({ success: true, changes: this.changes });
                }
            );
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM assistance_requests WHERE id = ?", [id], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    static deleteAll() {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM assistance_requests", [], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = AssistanceDAO;
