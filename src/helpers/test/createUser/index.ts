import {
  User,
} from '@src/db/models';

import genPassword from '@src/helpers/genPassword';

export default async ({
  confirmed = true,
  email = 'user@email.com',
  facebookId,
  googleId,
  isBlackListed = false,
  hasNewNotifications,
  password = 'Password0!',
  pseudonym,
  role = 'user',
  socialMediaUserName,
  userName = 'user',
}: {
  confirmed?: boolean;
  email?: string;
  facebookId?: string;
  googleId?: string;
  hasNewNotifications?: number;
  isBlackListed?: boolean;
  password?: string;
  pseudonym?: string;
  role?: 'admin' | 'superAdmin' | 'user';
  socialMediaUserName?: string;
  userName?: string;
}) => {
  const newUser = {
    confirmed: confirmed !== undefined ? confirmed : true,
    email: email || 'user@email.com',
    facebookId,
    googleId,
    hasNewNotifications,
    isBlackListed,
    pseudonym: pseudonym || userName || 'pseudonym',
    role: role || 'superAdmin',
    socialMediaUserName,
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
