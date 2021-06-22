import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
  option: {
    body: {
      reason?: any,
      time?: any
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .post(`/users/${userId}/blackLists/`)
    .set('authorization', token)
    .send(option.body);
  return response;
};
