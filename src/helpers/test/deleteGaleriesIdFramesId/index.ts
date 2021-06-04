import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  frameId: string,
) => {
  const response = await request(app)
    .delete(`/galeries/${galerieId}/frames/${frameId}`)
    .set('authorization', token);
  return response;
};
