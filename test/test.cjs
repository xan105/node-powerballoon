'use strict';

const balloon = require('../balloon.cjs');

balloon({
  title: "NPM",
  message: "Installed.",
  ico: "C:\\Program Files\\nodejs\\node.exe"
}).catch((err) => { 
  console.error(err);
});