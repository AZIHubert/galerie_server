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

// TODO:
// allow GET /galeries/ to filter by name

// TODO:
// normalize migration and model
// migration replace default by defaultValue
// Model => use decorators everywhere

// TODO:
// delete @root/

// TODO:
// create Report model

// TODO: for later
// when the creator delete his account
// create an election
// If they're is only one admin
// he become the steward for the admin (same right than the creator)
// else all the admin became candidat to become the steward.
// after one week, the admin who has the more vote become the intendant
// if equality pink a random one.
// if no admin, all users became candidat.
