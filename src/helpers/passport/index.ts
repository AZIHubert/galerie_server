import passport from 'passport';

import jwt from './jwt';
import GoogleStrategy from './google';
import FacebookStrategy from './facebook';

passport.use(jwt);
passport.use('google', GoogleStrategy);
passport.use('facebook', FacebookStrategy);

export default passport;
