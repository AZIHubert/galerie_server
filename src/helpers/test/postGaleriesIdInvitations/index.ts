import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  body: {
    numOfInvits?: any;
    time?: any;
  },
) => {
  const response = await request(app)
    .post(`/galeries/${galerieId}/invitations`)
    .set('authorization', token)
    .send(body);
  return response;
};
