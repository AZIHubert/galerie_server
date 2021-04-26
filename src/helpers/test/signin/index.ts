import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  body: {
    confirmPassword?: any;
    email?: any;
    password?: any;
    userName?: any;
  },
) => {
  const response = await request(app)
    .post('/users/signin/')
    .send(body);
  return response;
};
