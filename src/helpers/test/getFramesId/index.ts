import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  frameId: string,
) => {
  const response = await request(app)
    .get(`/frames/${frameId}`)
    .set('authorization', token);
  return response;
};
