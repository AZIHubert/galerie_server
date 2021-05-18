import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
) => {
  const response = await request(app)
    .get('/users/refreshToken/')
    .set('authorization', token);
  return response;
};
