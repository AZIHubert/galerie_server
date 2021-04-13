import { hash } from 'bcrypt';

import {
  User,
} from '@src/db/models';

import saltRounds from '@src/helpers/saltRounds';

export default async ({
  confirmed = true,
  email,
  password,
  role = 'user',
  userName,
}: {
  confirmed?: boolean;
  email?: string;
  password?: string;
  role?: 'admin' | 'user'
  userName?: string;
}) => {
  const newUser = {
    confirmed,
    email: email === undefined ? 'user@email.com' : email,
    pseudonym: userName || 'pseudonym',
    role,
    userName: userName === undefined ? '@userName' : `@${userName}`,
  };
  const hashPassword = await hash(
    password === undefined ? 'Password0!' : password,
    saltRounds,
  );
  const user = await User.create({
    ...newUser,
    password: hashPassword,
  });
  return user;
};
