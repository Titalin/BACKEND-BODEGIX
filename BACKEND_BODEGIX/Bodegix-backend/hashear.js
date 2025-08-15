const bcrypt = require('bcryptjs');

const contraseña = 'Taco';

const hash = bcrypt.hashSync(contraseña, 10);

console.log('Contraseña hasheada:', hash);
