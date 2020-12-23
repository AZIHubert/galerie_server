import 'dotenv/config';
import 'module-alias/register';

import sequelize from '@src/db';
import accessEnv from '@src/helpers';
import initApp from '@src/server';

const PORT = accessEnv('PORT', 8000);
sequelize.authenticate()
  .then(() => {
    console.log('db conntected...');
    initApp().listen(PORT, () => {
      console.log(`App starte on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('Error: ', err);
  });
