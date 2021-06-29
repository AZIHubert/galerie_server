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
