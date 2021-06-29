import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';
import Frame from '../frame';

interface ReportI {
  autoIncrementId: number;
  frameId: string;
  id: string;
  userId: string;
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

  // The superAdmin who create the betaKey.
  // If null, the superAdmin has deleted his account.
  @ForeignKey(() => Frame)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  frameId!: string;

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  // The id of the user who use
  // this beta key.
  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => Frame, {
    foreignKey: 'frameId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  frame!: Frame;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  user!: User;
}
