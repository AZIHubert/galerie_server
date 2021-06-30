import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
  profilePictureId: string,
) => {
  const response = await request(app)
    .post(`/users/${userId}/profilePictures/${profilePictureId}/reports/`)
    .set('authorization', token);
  return response;
};
