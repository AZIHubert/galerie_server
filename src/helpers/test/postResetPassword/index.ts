import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  {
    email,
  } : {
    email?: any;

  },
) => {
  const response = await request(app)
    .post('/users/resetPassword/')
    .send({
      email,
    });
  return response;
};
