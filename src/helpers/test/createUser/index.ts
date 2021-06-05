import { hash } from 'bcrypt';

import {
  User,
} from '@src/db/models';

import saltRounds from '@src/helpers/saltRounds';

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

  const hashPassword = await hash(
    userPassword,
    saltRounds,
  );
  const user = await User.create({
    ...newUser,
    password: hashPassword,
  });

  return {
    password: userPassword,
    user,
  };
};
