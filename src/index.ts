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
// check that Model.autoIncrementId is send.

// TODO:
// Check that typeof +req.params.previous === number
// and > 1

// TODO:
// allow GET /galeries/ to filter by name

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

// TODO:
// create Report model
