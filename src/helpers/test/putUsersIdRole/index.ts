import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
  option: {
    body: {
      password?: any;
      role?: any;
    }
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .put(`/users/${userId}/role/`)
    .set('authorization', token)
    .send(option.body);
  return response;
};
