import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Pratica extends Document {
  @Prop({ required: true })
  nomeUsuario!: string;

  @Prop({ required: true })
  tipo!: string;

  @Prop({ required: true })
  data!: Date;

  @Prop()
  descricao?: string;
}

export const PraticaSchema = SchemaFactory.createForClass(Pratica);
