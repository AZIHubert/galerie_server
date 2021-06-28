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
// https://stackoverflow.com/questions/38211170/sequelize-pagination
// create an autoincrement id for all models
// where these are supposed to be return by pack
// in this request send this autoIncrementId to the query of
// the request
// and return next where autoIncrementId > last model.autoIncrementId

// When fetching by string
// never allow to fetch by non unique field (user.pseudonym)
// assure that all unique fields are really unique (betaKey.email)

// TODO:
// create Report model

// TODO:
// normalize migration and model
// migration replace default by defaultValue
// Model => use decorators everywhere

// TODO:
// change galerie.name => galerie.hiddenName (unique)
// add galerie.name (non unique)
// when create (put name of) a galerie
// generate a unique hiddenName = ${name}-${uniqueId}
// =>
// check (by last created) if a galerie with same name exist
// hiddrenNamNumGen = existingGalerie.hiddenName.replace(`${name}-`, '');
// set new (updated) galerie hidden Name ${name}-${existedGalerieHiddenNameNumGen + 1}
// this hiddenName is used to order galerie by name.
// [['hiddenName', 'ASC']]
