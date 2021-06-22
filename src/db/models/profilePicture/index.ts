import {
  BelongsTo,
  Column,
  DataType,
  Default,
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
    allowNull: false,
    type: DataType.UUID,
  })
  cropedImageId!: string;

  // If true, this profile picture
  // is the display one of the user.
  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  current!: boolean;

  @Column({
    allowNull: false,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  originalImageId!: string;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  pendingImageId!: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => Image, {
    foreignKey: 'cropedImageId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  cropedImage!: Image;

  @BelongsTo(() => Image, {
    foreignKey: 'originalImageId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  originalImage!: Image;

  @BelongsTo(() => Image, {
    foreignKey: 'pendingImageId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  pendingImage!: Image;

  @BelongsTo(() => User)
  user!: User;
}
