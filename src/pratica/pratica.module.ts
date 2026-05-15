import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PraticaController } from './pratica.controller';
import { PraticaService } from './pratica.service';
import { Pratica, PraticaSchema } from './pratica.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Pratica.name, schema: PraticaSchema }])],
  controllers: [PraticaController],
  providers: [PraticaService],
})

export class PraticaModule {}
