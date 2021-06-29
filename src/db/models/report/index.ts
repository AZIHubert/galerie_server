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
import ReportUser from '../reportUser';

interface ReportI {
  autoIncrementId: number;
  classed: boolean;
  frameId: string;
  id: string;
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

  // The superAdmin who create the betaKey.
  // If null, the superAdmin has deleted his account.
  @ForeignKey(() => Frame)
  @Column({
    allowNull: false,
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

  @BelongsTo(() => Frame, {
    foreignKey: 'frameId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  frame!: Frame;

  @BelongsToMany(() => User, () => ReportUser)
  users!: Array<User & {GalerieUser: ReportUser}>;
}
