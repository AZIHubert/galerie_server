import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  body: {
    email?: string;
  },
) => {
  const response = await request(app)
    .post('/users/confirmation')
    .send(body);
  return response;
};
