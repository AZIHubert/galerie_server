import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Image from '../image';
import User from '../user';

interface ProfilePictureI {
  id: string;
  current: boolean;
  originalImageId: string
}

@Table({
  defaultScope: {
    attributes: { exclude: ['deletedAt'] },
  },
  paranoid: true,
  tableName: 'profilePicture',
})
export default class ProfilePicture extends Model implements ProfilePictureI {
  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  current!: boolean;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  originalImageId!: string;

  @BelongsTo(() => Image, 'originalImageId')
  originalImage!: Image;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  cropedImageId!: string;

  @BelongsTo(() => Image, 'cropedImageId')
  cropedImage!: Image;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  pendingImageId!: string;

  @BelongsTo(() => Image, 'pendingImageId')
  pendingImage!: Image;
}