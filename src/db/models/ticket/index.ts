import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';

interface TicketI {
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
    type: DataType.STRING,
  })
  body!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  header!: string;

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

  @BelongsTo(() => User)
  user!: User;
}
