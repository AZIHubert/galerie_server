import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  {
    password,
  } : {
    password?: any;

  },
) => {
  const response = await request(app)
    .post('/users/me/updateEmail/')
    .set('authorization', token)
    .send({
      password,
    });
  return response;
};
