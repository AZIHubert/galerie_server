import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  blackListId: string,
) => {
  const response = await request(app)
    .delete(`/blackLists/${blackListId}/`)
    .set('authorization', token);
  return response;
};
