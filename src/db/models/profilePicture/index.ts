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
  cropedImageId?: string;
  current: boolean;
  id: string;
  originalImageId?: string;
  pendingImageId?: string;
  userId: string;
}

@Table({
  tableName: 'profilePicture',
})
export default class ProfilePicture extends Model implements ProfilePictureI {
  @ForeignKey(() => Image)
  @Column({
    type: DataType.BIGINT,
  })
  cropedImageId!: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  current!: boolean;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @ForeignKey(() => Image)
  @Column({
    type: DataType.BIGINT,
  })
  originalImageId!: string;

  @ForeignKey(() => Image)
  @Column({
    type: DataType.BIGINT,
  })
  pendingImageId!: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  userId!: string;

  @BelongsTo(() => Image, 'cropedImageId')
  cropedImage!: Image;

  @BelongsTo(() => Image, 'originalImageId')
  originalImage!: Image;

  @BelongsTo(() => Image, 'pendingImageId')
  pendingImage!: Image;

  @BelongsTo(() => User)
  user!: User;
}
