import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  reportId: string,
) => {
  const response = await request(app)
    .put(`/reports/${reportId}/`)
    .set('authorization', token);
  return response;
};
