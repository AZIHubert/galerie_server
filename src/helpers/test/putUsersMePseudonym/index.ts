import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    body: {
      pseudonym?: any
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .put('/users/me/pseudonym/')
    .set('authorization', token)
    .send(option.body);
  return response;
};
