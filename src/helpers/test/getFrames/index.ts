import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    me?: string;
    previousFrame?: string,
  } = {},
) => {
  const {
    me,
    previousFrame,
  } = option;
  let query = '';
  if (me) {
    query = `${query}${query === '' ? '' : '&'}me=${me}`;
  }
  if (previousFrame) {
    query = `${query}${query === '' ? '' : '&'}previousFrame=${previousFrame}`;
  }
  const response = await request(app)
    .get(`/frames${query === '' ? '' : `?${query}`}`)
    .set('authorization', token);
  return response;
};
