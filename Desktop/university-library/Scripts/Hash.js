
// Save this as hash.js and run: node hash.js
const bcrypt = require('bcryptjs');

const password = '12345678';

bcrypt.hash(password, 10).then(hash => {
  console.log('Hashed password:', hash);
});