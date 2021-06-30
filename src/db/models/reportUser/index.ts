import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Report from '../report';
import User from '../user';

interface ReportUserI {
  reportId: string;
  userId: string;
}

@Table({
  tableName: 'reportUser',
})
export default class ReportUser extends Model implements ReportUserI {
  @ForeignKey(() => Report)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  reportId!: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;
}
