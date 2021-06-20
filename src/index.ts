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
// Refactor POST /galeries/:galerieId/frames/
// to be the same as POST /profilePictures/
// TODO:
// GET /users/me/currentProfilePicture/
// TODO:
// GET /users/:userId/currentProfilePicture/
// TODO:
// when fetch user at any place on galerie
// return user with isBlackListed
// instead of null.
