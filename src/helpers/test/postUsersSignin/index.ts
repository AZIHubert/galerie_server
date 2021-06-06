import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  option: {
    body: {
      confirmPassword?: any;
      email?: any;
      password?: any;
      userName?: any;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .post('/users/signin/')
    .send(option.body);
  return response;
};
