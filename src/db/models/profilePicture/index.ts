import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';

import Image from '../image';
import User from '../user';

interface ProfilePictureI {
  cropedImageId: string;
  currentProfilePicture: User;
  id: string;
  originalImageId: string;
  pendingImageId: string;
  userId: string;
}

@Table({
  defaultScope: {
    attributes: { exclude: ['deletedAt'] },
  },
  paranoid: true,
  tableName: 'profilePicture',
})
export default class ProfilePicture extends Model implements ProfilePictureI {
  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  cropedImageId!: string;

  @HasOne(() => User, 'currentProfilePictureId')
  currentProfilePicture!: User;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  originalImageId!: string;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
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
