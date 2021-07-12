import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  frameId: string,
  option: {
    body?: {
      reason?: any;
    }
  } = {},
) => {
  const response = await request(app)
    .post(`/frames/${frameId}/reports/`)
    .set('authorization', token)
    .send(option.body);
  return response;
};
