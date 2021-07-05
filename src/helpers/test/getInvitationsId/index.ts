import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  invitationId: string,
) => {
  const response = await request(app)
    .get(`/invitations/${invitationId}`)
    .set('authorization', token);
  return response;
};
