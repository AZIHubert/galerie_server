import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  option: {
    description?: any;
    notAnImage?: boolean;
    numOfGaleriePictures?: number;
  } = {
    notAnImage: false,
    numOfGaleriePictures: 1,
  },
) => {
  let response: request.Response;
  if (option.notAnImage) {
    response = await request(app)
      .post(`/galeries/${galerieId}/frames`)
      .set('authorization', token)
      .attach('image', `${__dirname}/../ressources/text.txt`);
  } else {
    switch (option.numOfGaleriePictures) {
      case 0:
        if (option.description) {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .field('description', option.description);
        } else {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token);
        }
        break;
      case 1:
        if (option.description) {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .field('description', option.description);
        } else {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`);
        }
        break;
      case 2:
        if (option.description) {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .field('description', option.description || '');
        } else {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`);
        }
        break;
      case 3:
        if (option.description) {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .field('description', option.description || '');
        } else {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`);
        }
        break;
      case 4:
        if (option.description) {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .field('description', option.description || '');
        } else {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`);
        }
        break;
      case 5:
        if (option.description) {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .field('description', option.description || '');
        } else {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`);
        }
        break;
      case 6:
        if (option.description) {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .field('description', option.description);
        } else {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .attach('image', `${__dirname}/../ressources/image.jpg`);
        }
        break;
      case 7:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`);
        break;
      default:
        if (option.description) {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`)
            .field('description', option.description || '');
        } else {
          response = await request(app)
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../ressources/image.jpg`);
        }
    }
  }
  return response;
};
