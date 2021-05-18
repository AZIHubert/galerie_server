import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  body: {
    code?: any;
  },
) => {
  const response = await request(app)
    .post('/galeries/subscribe/')
    .set('authorization', token)
    .send(body);
  return response;
};
