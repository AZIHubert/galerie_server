import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
  body: {
    reason?: any,
    time?: any
  },
) => {
  const response = await request(app)
    .post(`/users/blacklist/${userId}/`)
    .set('authorization', token)
    .send(body);
  return response;
};
