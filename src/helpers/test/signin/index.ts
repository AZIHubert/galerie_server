import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  {
    confirmPassword,
    email,
    password,
    userName,
  } : {
    confirmPassword?: any;
    email?: any;
    password?: any;
    userName?: any;
  },
) => {
  const response = await request(app)
    .post('/users/signin/')
    .send({
      confirmPassword,
      email,
      password,
      userName,
    });
  return response;
};
