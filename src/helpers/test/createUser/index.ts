import {
  User,
} from '@src/db/models';

import genPassword from '@src/helpers/genPassword';

export default async ({
  confirmed = true,
  email,
  facebookId,
  googleId,
  password,
  role = 'user',
  userName,
}: {
  confirmed?: boolean;
  email?: string;
  facebookId?: string;
  googleId?: string;
  password?: string;
  role?: 'admin' | 'superAdmin' | 'user'
  userName?: string;
}) => {
  const newUser = {
    confirmed,
    email: email === undefined ? 'user@email.com' : email,
    facebookId,
    googleId,
    pseudonym: userName || 'pseudonym',
    role,
    userName: userName === undefined ? '@userName' : `@${userName}`,
  };
  const userPassword = password === undefined ? 'Password0!' : password;

  const {
    hash,
    salt,
  } = genPassword(userPassword);

  const user = await User.create({
    ...newUser,
    hash,
    salt,
  });

  return {
    password: userPassword,
    user,
  };
};
