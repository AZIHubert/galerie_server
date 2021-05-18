import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  profilePictureId: string,
) => {
  const response = await request(app)
    .put(`/profilePictures/${profilePictureId}`)
    .set('authorization', token);
  return response;
};
