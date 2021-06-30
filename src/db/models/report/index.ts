import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';
import Frame from '../frame';
import ProfilePicture from '../profilePicture';
import ReportUser from '../reportUser';

interface ReportI {
  autoIncrementId: number;
  classed: boolean;
  frameId: string | null;
  id: string;
  profilePictureId: string | null;
  numOfReports: number;
}

@Table({
  tableName: 'report',
})
export default class Report extends Model implements ReportI {
  // Required to order by created at without
  // having replicate Model.
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  classed!: boolean;

  @ForeignKey(() => Frame)
  @Column({
    type: DataType.UUID,
    unique: true,
  })
  frameId!: string;

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  @Default(1)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  numOfReports!: number;

  @ForeignKey(() => ProfilePicture)
  @Column({
    type: DataType.UUID,
    unique: true,
  })
  profilePictureId!: string;

  @BelongsTo(() => Frame, {
    foreignKey: 'frameId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  frame!: Frame;

  @BelongsTo(() => ProfilePicture, {
    foreignKey: 'profilePictureId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  profilePicture!: ProfilePicture;

  @BelongsToMany(() => User, () => ReportUser)
  users!: Array<User & {GalerieUser: ReportUser}>;
}
