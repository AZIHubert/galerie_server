import sequelize from '@src/db';
import { Sequelize } from 'sequelize-typescript';

const autenticate = (callback?: () => void): Sequelize => {
  sequelize.authenticate();
  if (callback) callback();
  return sequelize;
};

export default autenticate;
