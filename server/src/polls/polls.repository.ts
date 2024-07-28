import { ConfigService } from '@nestjs/config';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IORedisKey } from 'src/redis.module';
import { Redis } from 'ioredis';
import { CreatePollData, AddParticipantData } from './types';
import { Poll } from 'shared';

@Injectable() //cho phép cung cấp kho lưu trữ này dưới dạng dịch vụ hoặc nhà cung cấp cho poll.module
export class PollsRepository {
  // to use time-to-live from configuration
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    ConfigService: ConfigService,
    //dung inject để cho phép truy cập tới redisClient
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    // thoi gian ton tai cua cau hoi
    this.ttl = ConfigService.get('POLL_DURATION');
  }

  //tao ra poll moi (userID, pollID duoc tao o create poll service, con nhung cai con lai lay tu bài viết đầu tiên đến poll controller nên dc lấy từ API)
  async CreatePoll({
    pollID,
    topic,
    votesPerVoter,
    userID,
  }: CreatePollData): Promise<Poll> {
    //thực hiện lời hứa ở poll-types
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      //khởi tạo với chưa có người tham gia nào
      adminID: userID,
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL ${
        this.ttl
      }`,
    );
    //tạo key để lưu vào redis
    const key = `polls:${pollID}`;

    //set du lieu cho key bang redisClient
    try {
      await this.redisClient
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, this.ttl],
        ])
        .exec(); //thực thi
      return initialPoll;
    } catch (e) {
      this.logger.error(
        `Failed to add poll ${JSON.stringify(initialPoll)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Attempting to get poll with: ${pollID}`);

    const key = `polls:${pollID}`;
    try {
      const currentPoll = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );

      this.logger.verbose(currentPoll);

      // if (currentPoll?.hasStarted) {
      //   throw new BadRequestException('The poll has already started');
      // }
      return JSON.parse(currentPoll);
    } catch (e) {
      this.logger.error(`Failed to get pollId ${pollID}`);
      throw e;
    }
  }
  async AddParticipant({
    pollID,
    userID,
    name,
  }: AddParticipantData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      const pollJSON = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );

      const poll = JSON.parse(pollJSON) as Poll;

      this.logger.debug(
        `Current Participants for pollID: ${pollID}:`,
        poll.participants,
      );

      return poll;
    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
      );
      throw e;
    }
  }
}
