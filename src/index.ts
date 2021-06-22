import 'module-alias/register';

import './helpers/initEnv';

import accessEnv from './helpers/accEnv';
import initSequelize from './helpers/initSequelize.js';

import initApp from './server';

const PORT = accessEnv('PORT');

initSequelize(() => {
  console.log('DB connected...');

  initApp().listen(PORT, () => {
    console.log(`App start on port ${PORT}`);
  });
});

// TODO:
// when fetch blackListed user at any place on galerie
// return user with isBlackListed
// instead of null.

// TODO:
// galeriePictures => image onDelete CASCADE
// and add Image hasOne
// like profile pictures

// TODO:
// Model role === enum
// https://github.com/RobinBuschmann/sequelize-typescript/issues/11
// https://sequelize.org/master/class/lib/data-types.js~ENUM.html

// TODO:
// create Report model
