import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PraticaModule } from './pratica/pratica.module';

@Module({
  imports: [
    MongooseModule.forRoot('URL_DO_MONGODB'), 
    PraticaModule
  ],
})

export class AppModule {}
