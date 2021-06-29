import { Sequelize } from 'sequelize-typescript';

import sequelize from '#src/db';

const autenticate = (callback?: () => void): Sequelize => {
  sequelize.authenticate();
  if (callback) callback();
  return sequelize;
};

export default autenticate;
