const db = require('../db');
const crypto = require('crypto');

class UserDAO {
    static getAll(role) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT u.*, a.zip 
                FROM users u
                LEFT JOIN user_addresses a ON u.id = a.userId
            `;
            const params = [];

            if (role) {
                sql += " WHERE u.role = ?";
                params.push(role);
            }

            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.*, a.street, a.apartment, a.city, a.state, a.zip
                FROM users u
                LEFT JOIN user_addresses a ON u.id = a.userId
                WHERE u.id = ?
            `;
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else {
                    const { street, apartment, city, state, zip, ...user } = row;
                    resolve({
                        ...user,
                        address: street ? { street, apartment, city, state, zip } : null
                    });
                }
            });
        });
    }

    static getByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.*, a.street, a.apartment, a.city, a.state, a.zip
                FROM users u
                LEFT JOIN user_addresses a ON u.id = a.userId
                WHERE u.email = ?
            `;
            db.get(sql, [email], (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else {
                    const { street, apartment, city, state, zip, ...user } = row;
                    resolve({
                        ...user,
                        address: street ? { street, apartment, city, state, zip } : null
                    });
                }
            });
        });
    }

    static getByPhone(phone) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.*, a.street, a.apartment, a.city, a.state, a.zip
                FROM users u
                LEFT JOIN user_addresses a ON u.id = a.userId
                WHERE (
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(u.phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ?
                    OR
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(u.phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = '1' || ?
                )
                ORDER BY CASE
                    WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(u.phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = '1' || ? THEN 0
                    ELSE 1
                END
                LIMIT 1
            `;
            let cleanedPhone = phone.replace(/\D/g, '');
            // If it's 11 digits starting with 1, get the last 10
            if (cleanedPhone.length === 11 && cleanedPhone.startsWith('1')) {
                cleanedPhone = cleanedPhone.substring(1);
            }

            db.get(sql, [cleanedPhone, cleanedPhone, cleanedPhone], (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else {
                    const { street, apartment, city, state, zip, ...user } = row;
                    resolve({
                        ...user,
                        address: street ? { street, apartment, city, state, zip } : null
                    });
                }
            });
        });
    }

    static getByFirebaseUid(firebaseUid) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.*, a.street, a.apartment, a.city, a.state, a.zip
                FROM users u
                LEFT JOIN user_addresses a ON u.id = a.userId
                WHERE u.firebaseUid = ?
            `;
            db.get(sql, [firebaseUid], (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else {
                    const { street, apartment, city, state, zip, ...user } = row;
                    resolve({
                        ...user,
                        address: street ? { street, apartment, city, state, zip } : null
                    });
                }
            });
        });
    }

    static create(userData) {
        const { basicInfo, phone, role, address, vehicles, credentials, dealerInfo, expertise, availability, otp } = userData;
        const email = basicInfo?.email;
        const id = crypto.randomUUID();
        const firebaseUid = otp?.firebaseUid || null;

        if (!email) {
            return Promise.reject(new Error("Email is required for registration"));
        }

        return new Promise((resolve, reject) => {
            let hasError = false;

            const handleError = (err) => {
                if (hasError) return;
                hasError = true;
                console.error("Registration error:", err);
                db.run("ROLLBACK", () => {
                    reject(err);
                });
            };

            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                // 1. Insert User
                const userSql = `INSERT INTO users (id, email, name, surname, phone, dob, role, profileImage, firebaseUid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(userSql, [
                    id,
                    email,
                    basicInfo.name,
                    basicInfo.surname,
                    phone?.phoneNumber || '',
                    basicInfo.dob || '',
                    role?.role || 'user',
                    basicInfo.profileImage || '',
                    firebaseUid
                ], (err) => {
                    if (err) return handleError(err);
                });

                // 2. Insert Address
                if (address) {
                    const addrSql = `INSERT INTO user_addresses (userId, type, street, apartment, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    db.run(addrSql, [
                        id,
                        address.type || 'home',
                        address.street || '',
                        address.apartment || '',
                        address.city || '',
                        address.state || '',
                        address.zip || ''
                    ], (err) => {
                        if (err) return handleError(err);
                    });
                }

                // 3. User-specific: Vehicles
                if (role?.role === 'user' && vehicles && Array.isArray(vehicles)) {
                    const vehicleSql = `INSERT INTO user_vehicles (id, userId, make, model, color, plate, vin, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                    vehicles.forEach(v => {
                        db.run(vehicleSql, [v.id, id, v.make, v.model, v.color, v.plate, v.vin, v.details], (err) => {
                            if (err) return handleError(err);
                        });
                    });
                }

                // 4. Mechanic-specific: Details & Availability
                if (role?.role === 'mechanic') {
                    const mechSql = `INSERT INTO mechanic_details (userId, workForDealer, companyName, companyInvitation, expertiseDetails, yearsExperience, aseMembership) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    db.run(mechSql, [
                        id,
                        dealerInfo?.workForDealer ? 1 : 0,
                        dealerInfo?.companyName || '',
                        dealerInfo?.companyInvitation || '',
                        expertise?.details || '',
                        expertise?.yearsExperience || '',
                        credentials?.aseMembership || ''
                    ], (err) => {
                        if (err) return handleError(err);
                    });

                    if (availability?.selectedDays && Array.isArray(availability.selectedDays)) {
                        const availSql = `INSERT INTO mechanic_availability (userId, day, startTime, endTime) VALUES (?, ?, ?, ?)`;
                        availability.selectedDays.forEach(day => {
                            db.run(availSql, [id, day, availability.startTime, availability.endTime], (err) => {
                                if (err) return handleError(err);
                            });
                        });
                    }
                }

                db.run("COMMIT", (err) => {
                    if (err) return handleError(err);
                    if (!hasError) {
                        resolve({ id, email, role: role?.role || 'user' });
                    }
                });
            });
        });
    }

    static update(id, updates) {
        return new Promise((resolve, reject) => {
            const { address, ...userUpdates } = updates;

            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                // Update users table
                if (Object.keys(userUpdates).length > 0) {
                    const keys = Object.keys(userUpdates);
                    const values = Object.values(userUpdates);
                    const setClause = keys.map(key => `${key} = ?`).join(', ');
                    const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
                    db.run(sql, [...values, id], function (err) {
                        if (err) {
                            db.run("ROLLBACK");
                            return reject(err);
                        }
                    });
                }

                // Update address table
                if (address) {
                    const { street, apartment, city, state, zip } = address;
                    // Using INSERT OR REPLACE (UPSERT style for SQLite)
                    const addrSql = `
                        INSERT INTO user_addresses (userId, street, apartment, city, state, zip)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON CONFLICT(userId) DO UPDATE SET
                            street = excluded.street,
                            apartment = excluded.apartment,
                            city = excluded.city,
                            state = excluded.state,
                            zip = excluded.zip
                    `;
                    db.run(addrSql, [id, street, apartment, city, state, zip], function (err) {
                        if (err) {
                            db.run("ROLLBACK");
                            return reject(err);
                        }
                    });
                }

                db.run("COMMIT", (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = UserDAO;
