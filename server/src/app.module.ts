import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PollsController } from './polls/polls.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [PollsController],
  providers: [],
})
export class AppModule {}
