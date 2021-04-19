import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import User from '../user';

interface GalerieUserI {
  galerieId?: string;
  role?: string;
  userId?: string;
}

@Table({
  tableName: 'galerieUser',
})
export default class GalerieUser extends Model implements GalerieUserI {
  @ForeignKey(() => Galerie)
  @Column({
    type: DataType.INTEGER,
  })
  galerieId!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  userId!: string;

  // Allow different action based on
  // the role of the user on this galerie.
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  role!: 'creator' | 'admin' | 'user';
}
