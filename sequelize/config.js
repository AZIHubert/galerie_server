require('dotenv').config();

module.exports.development = {
  dialect: 'postgres',
  url: process.env.DB_URL,
};

module.exports.test = {
  dialect: 'postgres',
  url: process.env.DB_URL,
};

module.exports.production = {
  dialect: 'postgres',
  url: process.env.DB_URL,
};
