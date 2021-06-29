import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  option: {
    previousInvitation?: string;
  } = {},
) => {
  let response: request.Response;
  if (option.previousInvitation) {
    response = await request(app)
      .get(`/galeries/${galerieId}/invitations/?previousInvitation=${option.previousInvitation}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get(`/galeries/${galerieId}/invitations/`)
      .set('authorization', token);
  }
  return response;
};
