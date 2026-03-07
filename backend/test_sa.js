const admin = require('firebase-admin');
const fs = require('fs');

const sa = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));
let key = sa.private_key;

console.log('Original key first 100 chars:', key.substring(0, 100));

// Method 1: replace backslash-n with newline
let key1 = key.replace(/\\n/g, '\n');

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      ...sa,
      private_key: key1
    })
  });
  console.log('✅ Method 1 Success');
} catch (e) {
  console.log('❌ Method 1 Failed:', e.message);
  admin.app().delete();
}

// Method 2: raw key (assuming require already handled \n)
try {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
  console.log('✅ Method 2 Success');
} catch (e) {
  console.log('❌ Method 2 Failed:', e.message);
}
