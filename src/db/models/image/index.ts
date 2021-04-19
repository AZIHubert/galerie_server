import {
  Column,
  DataType,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';

import ProfilePicture from '../profilePicture';

interface ImageI {
  bucketName: string;
  fileName: string;
  format: string;
  height: number;
  id: string;
  signedUrl?: string;
  size: number;
  width: number;
}

@Table({
  tableName: 'image',
})
export default class Image extends Model implements ImageI {
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  bucketName!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  fileName!: string;

  // jpg/jpeg/gif/png
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  format!: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  height!: number;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  // The Google bucket's signed url.
  // This is not saved in sequelize
  // but it is required and added to the Image object
  // every time an image is display on the apps.
  @Column({
    type: DataType.STRING,
  })
  signedUrl!: string;

  // Size of the image (bit)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  size!: number;

  @HasOne(() => ProfilePicture, {
    onDelete: 'CASCADE',
  })
  originalProfilePicture!: ProfilePicture;

  @HasOne(() => ProfilePicture, {
    onDelete: 'CASCADE',
  })
  pendingProfilePicture!: ProfilePicture;

  @HasOne(() => ProfilePicture, {
    onDelete: 'CASCADE',
  })
  cropedProfilePicture!: ProfilePicture;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  width!: number;
}
