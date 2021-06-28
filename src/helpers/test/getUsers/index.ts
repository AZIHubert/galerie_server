import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    blackListed?: 'true' | 'false';
    previousUser?: string;
    userName?: string;
  } = {},
) => {
  const {
    blackListed,
    previousUser,
    userName,
  } = option;
  let query = '';
  if (blackListed) {
    query = `${query}${query === '' ? '' : '&'}blackListed=${blackListed}`;
  }
  if (previousUser) {
    query = `${query}${query === '' ? '' : '&'}previousUser=${previousUser}`;
  }
  if (userName) {
    query = `${query}${query === '' ? '' : '&'}userName=${userName}`;
  }
  const response = await request(app)
    .get(`/users/${query === '' ? '' : `?${query}`}`)
    .set('authorization', token);
  return response;
};
