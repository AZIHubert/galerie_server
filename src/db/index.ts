import { Sequelize } from 'sequelize-typescript';
import accessEnv from '@src/helpers/accEnv';

import User from './models/user';
import Galerie from './models/galerie';

const DB_USERNAME = accessEnv('DB_USERNAME');
const DB_PASSWORD = accessEnv('DB_PASSWORD');
const DB_DATABASE = accessEnv('DB_DATABASE');

const sequelize = new Sequelize({
  database: `${DB_DATABASE}`,
  dialect: 'postgres',
  username: DB_USERNAME,
  password: DB_PASSWORD,
  storage: ':memory:',
  logging: false,
});
sequelize.addModels([User, Galerie]);

export default sequelize;
