import passport from 'passport';

import jwt from './jwt';

passport.use(jwt);

export default passport;
