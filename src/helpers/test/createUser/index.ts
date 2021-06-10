import {
  User,
} from '@src/db/models';

import genPassword from '@src/helpers/genPassword';

export default async ({
  confirmed = true,
  email = 'user@email.com',
  facebookId,
  googleId,
  password = 'Password0!',
  pseudonym,
  role = 'user',
  userName = 'user',
}: {
  confirmed?: boolean;
  email?: string;
  facebookId?: string;
  googleId?: string;
  password?: string;
  pseudonym?: string;
  role?: 'admin' | 'superAdmin' | 'user'
  userName?: string;
}) => {
  const newUser = {
    confirmed: confirmed !== undefined ? confirmed : true,
    email: email || 'user@email.com',
    facebookId,
    googleId,
    pseudonym: pseudonym || userName || 'pseudonym',
    role: role || 'superAdmin',
    userName: `@${userName}` || '@userName',
  };

  const {
    hash,
    salt,
  } = genPassword(password || 'Password0!');

  const user = await User.create({
    ...newUser,
    hash,
    salt,
  });

  return {
    password: password || 'Password0!',
    user,
  };
};
