import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  betaKeyId: string,
) => {
  const response = await request(app)
    .delete(`/betaKeys/${betaKeyId}`)
    .set('authorization', token);
  return response;
};
