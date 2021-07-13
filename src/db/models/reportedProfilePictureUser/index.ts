import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import ProfilePicture from '../profilePicture';
import User from '../user';

interface ReportedProfilePictureUserI {
  profilePictureId: string;
  userId: string;
}

@Table({
  tableName: 'reportedProfilePictureUser',
})
export default class ReportedProfilePictureUser
  extends Model
  implements ReportedProfilePictureUserI {
  @ForeignKey(() => ProfilePicture)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  profilePictureId!: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;
}
