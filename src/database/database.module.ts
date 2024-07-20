import { Module } from '@nestjs/common';
import { MongodbService } from './mongodb.service';

@Module({
  providers: [MongodbService],
  imports: [],
  exports: [MongodbService],
})
export class DatabaseModule {}
