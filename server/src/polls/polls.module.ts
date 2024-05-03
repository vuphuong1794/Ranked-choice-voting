import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), , PollsModule],
  controllers: [],
  providers: [],
})
export class PollsModule {}
