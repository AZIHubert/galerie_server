import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  body: {
    password?: any;

  },
) => {
  const response = await request(app)
    .post('/users/me/email/')
    .set('authorization', token)
    .send(body);
  return response;
};
