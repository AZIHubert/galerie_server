import { hash } from 'bcrypt';

import {
  User,
} from '@src/db/models';

import saltRounds from '@src/helpers/saltRounds';

export default async ({
  email,
  password,
  userName,
}: {
  email?: string
  password?: string;
  userName?: string;
}) => {
  const newUser = {
    email: email === undefined ? 'user@email.com' : email,
    pseudonym: 'userName',
    userName: userName === undefined ? '@userName' : `@${userName}`,
  };
  const hashPassword = await hash(
    password === undefined ? 'Password0!' : password,
    saltRounds,
  );
  const user = await User.create({
    ...newUser,
    confirmed: true,
    password: hashPassword,
  });
  return user;
};
