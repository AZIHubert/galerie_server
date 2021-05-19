import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  frameId: string,
  option: {
    body?: {
      description?: any;
    }
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .put(`/galeries/${galerieId}/frames/${frameId}/`)
    .set('authorization', token)
    .send(option.body);
  return response;
};
