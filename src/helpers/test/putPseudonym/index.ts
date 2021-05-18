import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  body: {
    pseudonym?: any
  },
) => {
  const response = await request(app)
    .put('/users/me/pseudonym/')
    .set('authorization', token)
    .send(body);
  return response;
};
