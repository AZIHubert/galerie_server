import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    body: {
      body?: any;
      header?: any;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .post('/tickets/')
    .set('authorization', token)
    .send(option.body);
  return response;
};
