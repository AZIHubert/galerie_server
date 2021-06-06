import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    body: {
      code?: any;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .post('/galeries/subscribe/')
    .set('authorization', token)
    .send(option.body);
  return response;
};
