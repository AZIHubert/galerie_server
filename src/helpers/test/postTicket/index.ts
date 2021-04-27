import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  body: {
    body?: any;
    header?: any;
  },
) => {
  const response = await request(app)
    .post('/tickets/')
    .set('authorization', token)
    .send(body);
  return response;
};
