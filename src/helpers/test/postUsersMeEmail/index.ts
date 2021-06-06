import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    body: {
      password?: any;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .post('/users/me/email/')
    .set('authorization', token)
    .send(option.body);
  return response;
};
