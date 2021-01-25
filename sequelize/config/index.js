require('dotenv').config({
  path: `./.env.${process.env.NODE_ENV || 'development'}`,
});

const {
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE,
  DB_HOST,
  DB_DIALECT,
} = process.env;

module.exports = {
  database: `${DB_DATABASE}`,
  dialect: DB_DIALECT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  host: DB_HOST,
};
