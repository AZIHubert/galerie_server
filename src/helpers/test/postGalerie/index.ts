import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  body: {
    name?: string;
  },
) => {
  const response = await request(app)
    .post('/galeries/')
    .set('authorization', token)
    .send(body);
  return response;
};
