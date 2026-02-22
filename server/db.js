const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// DB_PATH env var lets Docker volumes persist data outside the container.
// Default: same directory as db.js (original behaviour for local dev).
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'mechanic.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  // Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    surname TEXT,
    phone TEXT,
    dob TEXT,
    profileImage TEXT,
    role TEXT,
    isOnline INTEGER DEFAULT 0
  )`);

  // User Addresses Table
  db.run(`CREATE TABLE IF NOT EXISTS user_addresses (
    userId TEXT PRIMARY KEY,
    type TEXT,
    street TEXT,
    apartment TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // User Vehicles Table
  db.run(`CREATE TABLE IF NOT EXISTS user_vehicles (
    id TEXT PRIMARY KEY,
    userId TEXT,
    make TEXT,
    model TEXT,
    color TEXT,
    plate TEXT,
    vin TEXT,
    details TEXT,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Mechanic Details Table
  db.run(`CREATE TABLE IF NOT EXISTS mechanic_details (
    userId TEXT PRIMARY KEY,
    workForDealer INTEGER,
    companyName TEXT,
    companyInvitation TEXT,
    expertiseDetails TEXT,
    yearsExperience TEXT,
    aseMembership TEXT,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Mechanic Availability Table
  db.run(`CREATE TABLE IF NOT EXISTS mechanic_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    day TEXT,
    startTime TEXT,
    endTime TEXT,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Additional Funds Table (linked to appointments)
  db.run(`CREATE TABLE IF NOT EXISTS additional_funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointmentId TEXT,
    amount TEXT,
    type TEXT,
    details TEXT,
    status TEXT,
    timestamp TEXT,
    FOREIGN KEY(appointmentId) REFERENCES appointments(id)
  )`);

  // Reviews Table (linked to appointments)
  db.run(`CREATE TABLE IF NOT EXISTS appointment_reviews (
    appointmentId TEXT PRIMARY KEY,
    rating INTEGER,
    review TEXT,
    experienceTags TEXT,
    FOREIGN KEY(appointmentId) REFERENCES appointments(id)
  )`);

  // Setup Progress Table
  db.run(`CREATE TABLE IF NOT EXISTS setup_progress (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  // Assistance Requests Table
  db.run(`CREATE TABLE IF NOT EXISTS assistance_requests (
    id TEXT PRIMARY KEY,
    type TEXT,
    title TEXT,
    car TEXT,
    address TEXT,
    notes TEXT,
    budget TEXT,
    distance TEXT,
    date TEXT,
    userId TEXT,
    mechanicId TEXT,
    status TEXT,
    locationLat REAL,
    locationLng REAL,
    photos TEXT,
    vehicleId TEXT,
    zip TEXT,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Migration for new columns (safe to run even if columns exist in some sqlite versions, but usually throws. 
  // We'll trust the process or wrap in try/catch if we were running it, but we can't easily here. 
  // We'll just append them blindly or rely on the CREATE IF NOT EXISTS to hold the *old* schema and we need ALTER.
  // SQLite doesn't support IF NOT EXISTS in ALTER COLUMN.
  // We'll try to add them. If it fails, it fails (likely means they exist or table doesn't).
  // Actually, to be safe in this environment, I'll just run them and ignore errors in the callback if possible, 
  // but db.run is async.
  const columnsToAdd = [
    'ALTER TABLE assistance_requests ADD COLUMN locationLat REAL',
    'ALTER TABLE assistance_requests ADD COLUMN locationLng REAL',
    'ALTER TABLE assistance_requests ADD COLUMN photos TEXT',
    'ALTER TABLE assistance_requests ADD COLUMN vehicleId TEXT',
    'ALTER TABLE assistance_requests ADD COLUMN zip TEXT',
    'ALTER TABLE appointments ADD COLUMN zip TEXT',
    'ALTER TABLE users ADD COLUMN isOnline INTEGER DEFAULT 0'
  ];

  columnsToAdd.forEach(sql => {
    db.run(sql, () => { }); // Ignore errors (e.g. duplicate column)
  });

  // Appointments Table
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    type TEXT,
    title TEXT,
    date TEXT,
    time TEXT,
    car TEXT,
    address TEXT,
    notes TEXT,
    budget TEXT,
    status TEXT,
    cancelReason TEXT,
    acceptedAt TEXT,
    startedAt TEXT,
    completedAt TEXT,
    currentStatus TEXT,
    additionalFunds TEXT,
    clientReview TEXT,
    isReviewSubmitted INTEGER,
    isStatusUpdated INTEGER,
    userId TEXT,
    mechanicId TEXT,
    zip TEXT,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(mechanicId) REFERENCES users(id)
  )`);

  // Insert Default Users and Mock Data if empty
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row && row.count === 0) {
      const users = [
        ['user-1', 'john.doe@example.com', 'John', 'Doe', '+15550101234', '05/15/1988', 'user'],
        ['user-111', 'user111@example.com', 'Test', 'User', '+11111111111', '01/01/2000', 'user'],
        ['mech-1', 'ssammet135@gmail.com', 'Shayna', 'Samett', '+17188712281', '12/04/1995', 'mechanic'],
        ['mech-2', 'jane.smith@mechanic.com', 'Jane', 'Smith', '+15550205678', '08/22/1992', 'mechanic'],
        ['user-2', 'mike.brown@example.com', 'Mike', 'Brown', '+15550309012', '11/30/1985', 'user'],
        ['user-basic', 'user@example.com', 'Regular', 'User', '+11', '01/01/1990', 'user'],
        ['mech-basic', 'mechanic@example.com', 'Pro', 'Mechanic', '+12', '01/01/1985', 'mechanic']
      ];
      const stmt = db.prepare(`INSERT INTO users (id, email, name, surname, phone, dob, role) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      users.forEach(u => stmt.run(u));
      stmt.finalize();
    }
  });
});

module.exports = db;
