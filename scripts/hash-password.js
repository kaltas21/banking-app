const bcrypt = require('bcrypt');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.log('Usage: node hash-password.js <password>');
  process.exit(1);
}

// Hash the password
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  
  console.log('Original password:', password);
  console.log('Hashed password:', hash);
  console.log('\nUse this in your SQL:');
  console.log(`'${hash}'`);
});