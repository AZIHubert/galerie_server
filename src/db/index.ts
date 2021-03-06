import { Sequelize } from 'sequelize-typescript';

import accessEnv from '#src/helpers/accEnv';

import {
  BetaKey,
  BlackList,
  Frame,
  Galerie,
  GalerieBlackList,
  GaleriePicture,
  GalerieUser,
  Image,
  Invitation,
  Like,
  Notification,
  NotificationBetaKeyUsed,
  NotificationFrameLiked,
  NotificationFramePosted,
  NotificationUserSubscribe,
  ProfilePicture,
  Report,
  ReportedFrameUser,
  ReportedProfilePictureUser,
  ReportUser,
  Ticket,
  User,
} from './models';

const DB_USERNAME = accessEnv('DB_USERNAME');
const DB_PASSWORD = accessEnv('DB_PASSWORD');
const DB_DATABASE = accessEnv('DB_DATABASE');

const sequelize = new Sequelize({
  database: `${DB_DATABASE}`,
  dialect: 'postgres',
  username: DB_USERNAME,
  password: DB_PASSWORD,
  storage: ':memory:',
  logging: false,
  models: [
    BetaKey,
    BlackList,
    Frame,
    Galerie,
    GalerieBlackList,
    GaleriePicture,
    GalerieUser,
    Image,
    Invitation,
    Like,
    Notification,
    NotificationBetaKeyUsed,
    NotificationFrameLiked,
    NotificationFramePosted,
    NotificationUserSubscribe,
    ProfilePicture,
    Report,
    ReportedFrameUser,
    ReportedProfilePictureUser,
    ReportUser,
    Ticket,
    User,
  ],
});

export default sequelize;
