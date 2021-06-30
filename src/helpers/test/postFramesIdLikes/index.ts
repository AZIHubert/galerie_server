import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  frameId: string,
) => {
  const response = await request(app)
    .post(`/frames/${frameId}/likes`)
    .set('authorization', token);
  return response;
};
