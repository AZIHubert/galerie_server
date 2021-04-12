import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  email: string,
  password: string,
) => {
  const response = await request(app)
    .post('/users/login')
    .send({
      password,
      userNameOrEmail: email,
    });
  return response;
};
