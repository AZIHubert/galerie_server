import dotenv from 'dotenv';

const path = `./.env.${process.env.NODE_ENV || 'development'}`;

dotenv.config({
  path,
});
