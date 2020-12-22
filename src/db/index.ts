import { Sequelize } from 'sequelize-typescript';
import accessEnv from '@src/helpers';

import { users, galeries } from './models';

const DB_URL = accessEnv('DB_URL');

const sequelize = new Sequelize(DB_URL, {
  dialectOptions: {
    charset: 'utf8',
    multipleStatements: true,
  },
  logging: false,
  models: [
    users,
    galeries,
  ],
});

export default sequelize;
