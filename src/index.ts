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
// Create a new notification
// Only if not find notification
// or if other notification (seen or not seen)
// .updatedAt < last week
// Exemple
// find notification
// seen false
// or
// seen true
// through model
// createdAt il y a moins de 1 semaine
// si une notification a été créer et lu il y a moins d'une semaine
// pas besoin de créer une nouvelle notification
// juste notification.read === false
// et incrémenter notification.
// si une notification a été créer il y a plus d'une semaine mais n'a pas été lu
// pas besoin d'en créer une nouvelle, juste increment num.

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
