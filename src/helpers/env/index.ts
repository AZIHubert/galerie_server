import dotenv from 'dotenv';

const path = `./.env.${process.env.NODE_ENV}`;

dotenv.config({
  path,
});
