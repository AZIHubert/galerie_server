import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  option: {
    body: {
      email?: any;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .post('/users/password/')
    .send(option.body);
  return response;
};
