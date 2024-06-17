import { ConfigService } from '@nestjs/config';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IORedisKey } from 'src/redis.module';
import { Redis } from 'ioredis';
import { CreatePollData } from './types';
import { Poll } from 'shared';

@Injectable()
export class PollsRepository {
  // to use time-to-live from configuration
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    ConfigService: ConfigService,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    // thoi gian ton tai cua cau hoi
    this.ttl = ConfigService.get('POLLS_DURATION');
  }

  //tao ra poll moi (userID, pollID duoc tao o poll service, con nhung cai con lai lay tu API )
  async CreatePoll({
    pollID,
    topic,
    votesPerVoter,
    userID,
  }: CreatePollData): Promise<Poll> {
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      adminID: userID,
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL ${
        this.ttl
      }`,
    );

    const key = `polls:${pollID}`;

    //set du lieu cho key bang redisClient
    try {
      await this.redisClient
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, this.ttl],
        ])
        .exec();
      return initialPoll;
    } catch (e) {
      this.logger.error(
        `Failed to add poll ${JSON.stringify(initialPoll)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }
}
