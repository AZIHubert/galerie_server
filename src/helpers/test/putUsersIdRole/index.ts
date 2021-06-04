import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
  body: {
    role?: any
  },
) => {
  const response = await request(app)
    .put(`/users/${userId}/role/`)
    .set('authorization', token)
    .send(body);
  return response;
};
