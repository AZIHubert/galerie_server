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
// find galeries by name
// add picture(s) to a galerie
//
// => user
// => => hasMany frame
// => => belongsToMany galeries (throw userGalerie)
//
// => galerie
// => => hasMany galerieFrames
// => => belongsToMany users (throw userGalerie)
//
// => galerieFrames
// => => galerieId (foreignKey)
// => => hasMany Frame
// => => userId (foreignKey)
//
// => frame
// => original/croped/pending image (foreignKey)
// => => userId (foreignKey)
//
// => Image
// hasOne originalFrame
// hasOne cropedFrame
// hasOne pendingFrame
//
// remove picture(s) to a galeries if belong to current user
//
//
// add field user pseudoname
// when login pseudoName = userName
// pseudoname can be changed
//
//
// https://github.com/zachgoll/express-jwt-authentication-starter/blob/master/lib/utils.js
// user salt => genPassword(password).salt
// user hash => genPassword(password).hash
// user remove password
//
//
// const expires = moment().add(responseObj.expiresIn)
// localStorage.setItem('token', token);
// localStorage.setItem('expires', JSON.stringify(expires.valueOf()))
// if expire => /users/refreshToken
// const expiresAt = JSON.parse(localStorage.getItem('exipires))
//
// if(!moment().isBefore(moment(expiresAt))) => /users/refreshToken
//
//
//
// https://www.youtube.com/watch?v=A23O4aUftXk&t=3233s&ab_channel=RyanMichaelHirst

// test password contain spaces
