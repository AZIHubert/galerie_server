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
// when get notification orderBy trhought model createdBy
// https://github.com/sequelize/sequelize/issues/7634
// https://github.com/sequelize/sequelize/issues/10074

// TODO:
// Every where multiple Model with limit and offset are fetched
// Need to add a query.timestamp (Date)
// to indicate when the first request was made
// During to request of 2 different pages
// Model can be added and the are modifing the order
// so, some Model can be skipped
// so query.timestamp is require
// and returned Model are only the one
// where
// createdAt < query.timestamp

// TODO:
// create Report model
