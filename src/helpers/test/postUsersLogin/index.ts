import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  option: {
    body: {
      password?: any;
      userNameOrEmail?: any
    }
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .post('/users/login')
    .send(option.body);
  return response;
};
