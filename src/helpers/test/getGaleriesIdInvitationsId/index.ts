import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  invitationId: string,
) => {
  const response = await request(app)
    .get(`/galeries/${galerieId}/invitations/${invitationId}`)
    .set('authorization', token);
  return response;
};
