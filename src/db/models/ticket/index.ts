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

interface TicketI {
  autoIncrementId: number;
  body: string;
  header: string;
  id: string;
  userId: string;
}

@Table({
  tableName: 'ticket',
})
export default class Ticket extends Model implements TicketI {
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  body!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  header!: string;

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;
}
