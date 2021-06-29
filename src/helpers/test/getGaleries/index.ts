import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    all?: 'true' | 'false';
    name?: string;
    previousGalerie?: string;
  } = {},
) => {
  const {
    all,
    name,
    previousGalerie,
  } = option;
  let query = '';
  if (all) {
    query = `${query}${query === '' ? '' : '&'}all=${all}`;
  }
  if (name) {
    query = `${query}${query === '' ? '' : '&'}name=${name}`;
  }
  if (previousGalerie) {
    query = `${query}${query === '' ? '' : '&'}previousGalerie=${previousGalerie}`;
  }
  const response = await request(app)
    .get(`/galeries${query === '' ? '' : `?${query}`}`)
    .set('authorization', token);
  return response;
};
