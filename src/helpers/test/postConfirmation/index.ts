import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  {
    email,
  } : {
    email?: string;
  },
) => {
  const response = await request(app)
    .post('/users/confirmation')
    .send({ email });
  return response;
};
