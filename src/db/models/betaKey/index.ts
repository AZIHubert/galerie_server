import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';

interface BetaKeyI {
  code: string;
  createdById?: string;
  id: string;
  usedAt?: Date;
  userId: string;
}

@Table({
  tableName: 'betaKey',
})
export default class BetaKey extends Model implements BetaKeyI {
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  code!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  createdById!: string;

  @Column({
    allowNull: false,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;

  @BelongsTo(() => User, 'userId')
  user!: User;
}
