const db = require('../db');

class AppointmentDAO {
    static getAll(filters = {}) {
        let sql = `
            SELECT a.*, 
                   u.phone as userPhone, u.name as userName, u.surname as userSurname,
                   m.phone as mechanicPhone, m.name as mechanicName, m.surname as mechanicSurname
            FROM appointments a
            LEFT JOIN users u ON a.userId = u.id
            LEFT JOIN users m ON a.mechanicId = m.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.userId) {
            sql += " AND a.userId = ?";
            params.push(filters.userId);
        }
        if (filters.mechanicId) {
            sql += " AND a.mechanicId = ?";
            params.push(filters.mechanicId);
        }

        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else {
                    resolve(rows.map(row => ({
                        ...row,
                        additionalFunds: row.additionalFunds ? JSON.parse(row.additionalFunds) : [],
                        clientReview: row.clientReview ? JSON.parse(row.clientReview) : null
                    })));
                }
            });
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT a.*, 
                       u.phone as userPhone, u.name as userName, u.surname as userSurname,
                       m.phone as mechanicPhone, m.name as mechanicName, m.surname as mechanicSurname
                FROM appointments a
                LEFT JOIN users u ON a.userId = u.id
                LEFT JOIN users m ON a.mechanicId = m.id
                WHERE a.id = ?
            `, [id], (err, row) => {
                if (err) reject(err);
                else if (row) {
                    let additionalFunds = [];
                    try {
                        additionalFunds = row.additionalFunds ? JSON.parse(row.additionalFunds) : [];
                    } catch (e) {
                        // Fallback if already an object or invalid JSON
                        additionalFunds = typeof row.additionalFunds === 'object' ? row.additionalFunds : [];
                    }

                    let clientReview = null;
                    try {
                        clientReview = row.clientReview ? JSON.parse(row.clientReview) : null;
                    } catch (e) {
                        clientReview = typeof row.clientReview === 'object' ? row.clientReview : null;
                    }

                    resolve({
                        ...row,
                        additionalFunds,
                        clientReview
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    static create(appointment) {
        return new Promise((resolve, reject) => {
            const {
                id, type, title, date, time, car, address, zip, notes, budget, status,
                acceptedAt, currentStatus, additionalFunds, clientReview,
                isReviewSubmitted, isStatusUpdated, cancelReason, startedAt, completedAt,
                userId, mechanicId, assistanceType
            } = appointment;

            const sql = `INSERT OR REPLACE INTO appointments (
        id, type, title, date, time, car, address, zip, notes, budget, status, 
        acceptedAt, currentStatus, additionalFunds, clientReview,
        isReviewSubmitted, isStatusUpdated, cancelReason, startedAt, completedAt,
        userId, mechanicId, assistanceType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                id, type, title, date, time, car, address, zip, notes, budget, status,
                acceptedAt, currentStatus,
                JSON.stringify(additionalFunds || []),
                JSON.stringify(clientReview || null),
                isReviewSubmitted ? 1 : 0,
                isStatusUpdated ? 1 : 0,
                cancelReason, startedAt, completedAt,
                userId, mechanicId, assistanceType
            ].map(v => v === undefined ? null : v);

            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ ...appointment });
            });
        });
    }

    static update(id, updates) {
        return new Promise((resolve, reject) => {
            const keys = Object.keys(updates);
            if (keys.length === 0) return resolve(0);

            const values = Object.values(updates).map(val =>
                (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val
            );
            const setClause = keys.map(key => `${key} = ?`).join(', ');

            db.serialize(() => {
                const sql = `UPDATE appointments SET ${setClause} WHERE id = ?`;
                db.run(sql, [...values, id], function (err) {
                    if (err) return reject(err);

                    const changes = this.changes;

                    // If status is being updated to canceled, also update the assistance_requests table
                    if (updates.status === 'canceled') {
                        const assistanceSql = "UPDATE assistance_requests SET status = 'canceled' WHERE id = ?";
                        db.run(assistanceSql, [id], function (err) {
                            if (err) return reject(err);
                            resolve(changes);
                        });
                    } else {
                        resolve(changes);
                    }
                });
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM appointments WHERE id = ?", [id], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    static deleteAll() {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM appointments", [], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = AppointmentDAO;
