import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Frame from '../frame';
import User from '../user';

interface ReportedFrameUserI {
  frameId: string;
  userId: string;
}

@Table({
  tableName: 'reportedFrameUser',
})
export default class ReportedFrameUser
  extends Model
  implements ReportedFrameUserI {
  @ForeignKey(() => Frame)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  frameId!: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;
}
