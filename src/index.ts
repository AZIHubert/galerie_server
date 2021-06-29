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

// Include report when fetch frame
// delete report when delete frame
// delete report when delete galerie
// report.classified (default false)
// if an admin decide to not delete a frame
// report.classified become true
// if another user report this frame
// classified become true
// allow to fetch report by clased 'all' 'true' 'false'
// decrement report.numOfReports and destroy ReportUser when delete userMe

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
