import 'module-alias/register';

import './helpers/initEnv';
import initSequelize from './helpers/initSequelize.js';
import accessEnv from './helpers/accEnv';
import initApp from './server';

const PORT = accessEnv('PORT');

initSequelize(() => {
  console.log('DB connected...');

  initApp().listen(PORT, () => {
    console.log(`App start on port ${PORT}`);
  });
});

// TODO:
// create galerie and be an admin
// delete galerie if current user is admin
// update galerie if current user is admin (name and picture)
// get all galeries
// get a single galerie
// invite people to a galerie if current user is admin
// delete user to a galerie if current user is admin
// find galerie by name
// send an invite to a galerie to all admin user
// accept user to a galerie if current user is admin
// add picture to a galerie
// add pictures to a galere
// remove picture(s) to a galeries if belong to current user
//
//
// remove current field to PP
// add curentProfilePictureId to user (nullable)
// user belongsTo PP
// PP HasOne user
//
// Refactor all tests
// User errorMessages on all tests
// Check for token version and increment token version
// When user resend confirm email, increment confirmToken
// When user confirm, increment confirmToken
// When user resend reset password email, increment resetPasswordToken
// When user put refresh password, increment resetPasswordToken and authToken
// When user update email resend email, increment updateEmailToken
// When user confirm udpate email send email, increment updateEmailToken
// When user confirm udpate email resend email, increment confirmUpdateEmailToken
// When user update email, increment confirmUpdateEmailToken, and authToken
//
// add authToken to sign JWT on auth
// Check on middleware authToken version
