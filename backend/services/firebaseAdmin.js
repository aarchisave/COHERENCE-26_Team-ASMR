const admin = require('firebase-admin');

const path = require('path');
const fs   = require('fs');

let serviceAccount = null;
const saPath = path.join(__dirname, '../firebase-service-account.json');

if (fs.existsSync(saPath)) {
  serviceAccount = require(saPath);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT from env');
  }
}

if (serviceAccount && serviceAccount.project_id) {
  try {
    // Ensure newlines are correctly formatted for PEM
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  }
} else {
  console.warn('⚠️ Firebase Service Account is missing. Auth middleware will fail.');
}

module.exports = admin;
