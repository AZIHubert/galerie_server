import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  option: {
    body: {
      betaKey?: any;
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
    .post('/users/signin/beta')
    .send(option.body);
  return response;
};
