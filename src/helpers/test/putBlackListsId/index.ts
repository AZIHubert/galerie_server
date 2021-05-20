import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  blackListId: string,
  option: {
    body?: {
      time?: any;
    }
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .put(`/blackLists/${blackListId}/`)
    .set('authorization', token)
    .send(option.body);
  return response;
};
