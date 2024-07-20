import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LlmFactory } from './integrations/llm/llm.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, LlmFactory],
})
export class AppModule {}
