import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
) => {
  const response = await request(app)
    .post('/betaKeys/')
    .set('authorization', token);
  return response;
};
