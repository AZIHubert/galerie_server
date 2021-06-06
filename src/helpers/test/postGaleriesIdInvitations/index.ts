import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  option: {
    body: {
      numOfInvits?: any;
      time?: any;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .post(`/galeries/${galerieId}/invitations`)
    .set('authorization', token)
    .send(option.body);
  return response;
};
