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

// TODO: for later
// when the creator delete his account
// create an election
// If they're is only one admin
// he become the steward for the admin (same right than the creator)
// else all the admin became candidat to become the steward.
// after one week, the admin who has the more vote become the intendant
// if equality pink a random one.
// if no admin, all users became candidat.

// TODO: for later
// when allow registration through social media
// when register with a social media
// do not use socialMediaUserName
// instead, use ${userName}${increment}
// check if another user exist with the same userName
// if true, create a user with increment + 1
// same logic as Galerie.hiddenName.

// Demain, absolument finir tout ca, pas de dodo avant.
// Quand tout ca sera fini, on passe aux apps!!!!!!!
// TODO:
// GET /reposts/ (query classed: 'true' | 'false' | undefined (all))
// TODO:
// GET /reposts/:id
// TODO:
// PUT /reposts/:id (classed => true)
// TODO:
// when rename galerieUser.role/user.role to be 'admin' 'moderator' 'user'
// TODO:
// deleted galerie.archived
// TODO:
// if a user where galerieUser.role === 'admin' delete his account
// and this galerie still have users.
// Check if at least one moderator exist.
// if true, pick a random one to be the new admin of this galerie.
// else, pick a random user to be the new admin of this galerie
// Send a notification to this user.
// TODO:
// add notification.type === 'GALEIRIE_ADMIN'
// and notification.galerieId === galerie where the user became an admin
// TODO:
// when delete a galerie
// Check that notification where type === 'GALERIE_ADMIN' are destroy.
