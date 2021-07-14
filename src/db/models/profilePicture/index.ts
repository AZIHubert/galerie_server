import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';

import Image from '../image';
import Report from '../report';
import ReportedProfilePictureUser from '../reportedProfilePictureUser';
import User from '../user';

interface ProfilePictureI {
  autoIncrementId: number;
  cropedImageId: string;
  current: boolean;
  id: string;
  originalImageId: string;
  pendingHexes: string;
  userId: string;
}

@Table({
  tableName: 'profilePicture',
})
export default class ProfilePicture extends Model implements ProfilePictureI {
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

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

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
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

  @Column({
    type: DataType.STRING,
  })
  pendingHexes!: string;

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

  @BelongsTo(() => User)
  user!: User;

  @BelongsToMany(() => User, () => ReportedProfilePictureUser)
  usersReporting!: Array<
  User &
  {ReportedProfilePictureUser: ReportedProfilePictureUser}
  >

  @HasOne(() => Report)
  report!: Report;
}
