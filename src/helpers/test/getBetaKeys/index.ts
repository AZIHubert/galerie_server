import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    email?: string;
    previousBetaKey?: string;
    me?: 'true' | 'false';
    used?: 'true' | 'false';
  } = {},
) => {
  const {
    email,
    me,
    previousBetaKey,
    used,
  } = option;
  let query = '';
  if (email) {
    query = `${query}${query === '' ? '' : '&'}email=${email}`;
  }
  if (me) {
    query = `${query}${query === '' ? '' : '&'}me=${me}`;
  }
  if (previousBetaKey) {
    query = `${query}${query === '' ? '' : '&'}previousBetaKey=${previousBetaKey}`;
  }
  if (used) {
    query = `${query}${query === '' ? '' : '&'}used=${used}`;
  }
  const response = await request(app)
    .get(`/betaKeys${query === '' ? '' : `?${query}`}`)
    .set('authorization', token);
  return response;
};
