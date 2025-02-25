import { Inject, InternalServerErrorException } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IORedisKey } from 'src/redis.module';
import { AddNominationData, AddParticipantData, AddParticipantRankingsData, CreatePollData } from './types';
import { Nomination, Poll, Results } from 'shared';

@Injectable() //cho phép cung cấp kho lưu trữ này dưới dạng dịch vụ hoặc nhà cung cấp cho poll.module
export class PollsRepository {
  // to use time-to-live from configuration
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    configService: ConfigService,
    //dung inject để cho phép truy cập tới redisClient
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    // thoi gian ton tai cua cau hoi
    this.ttl = configService.get('POLL_DURATION');
  }

  //tao ra poll moi (userID, pollID duoc tao o create poll service, con nhung cai con lai lay tu req.body API CreatePoll)
  async createPoll({
    votesPerVoter,
    topic,
    pollID,
    userID,
  }: CreatePollData): Promise<Poll> {
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      //thực hiện lời hứa ở poll-types
      adminID: userID,
      nominations: {},
      rankings: {},
      results: [],
      hasStarted: false,
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
      this.logger.error(`Failed to get pollID ${pollID}`);
      throw new InternalServerErrorException(`Failed to get pollID ${pollID}`);
    }
  }

  async addParticipant({
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
      throw new InternalServerErrorException(
        `Failed to add participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
      );
    }
  }

  async removeParticipant(pollID: string, userID: string): Promise<Poll> {
    this.logger.log(`removing userID: ${userID} from pollID: ${pollID}`);

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, participantPath);
      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to remove userID: ${userID} from pollID: ${pollID}`,
        e,
      );
      throw new InternalServerErrorException('Failed to remove participant');
    }
  }

  //thêm lựa chọn vào poll
  async addNomination({
    pollID,
    nominationID,
    nomination,
  }: AddNominationData): Promise<Poll> {
    this.logger.log(
      `Attempting to add nomination with ID: ${nominationID} to poll with ID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        nominationPath,
        JSON.stringify(nomination),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add a nomination with nominationID/text: ${nominationID}/${nomination.text} to pollID: ${pollID}`,
        e,
      );

      throw new InternalServerErrorException(
        `Failed to add nomination with nominationID/text: ${nominationID}/${nomination.text} to pollID: ${pollID}`,
      );
    }
  }

  //xoa lua chon trong poll
  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    this.logger.log(
      `Attempting to remove nomination with ID: ${nominationID} from poll with ID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, nominationPath);
      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to remove nominationID: ${nominationID} from poll: ${pollID}`,
        e,
      );

      throw new InternalServerErrorException(
        `Failed to remove nominationID: ${nominationID} from poll: ${pollID}`,
      );
    }
  }

  async startPoll(pollID: string): Promise<Poll> {
    this.logger.log(`setting hasStarted for poll: ${pollID}`);

    const key = `polls:${pollID}`;

    try {
      // Cập nhật giá trị `hasStarted` của poll 
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        '.hasStarted',
        JSON.stringify(true),
      );

      // Lấy lại thông tin của poll sau khi cập nhật và trả về
      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(`Failed to start poll: ${pollID}`, e);
      throw new InternalServerErrorException(`The was an error starting the poll`);
    }
  }

  //thêm bảng xếp hạng cho người dùng
  async addParticipantRankings({pollID, userID, rankings}: AddParticipantRankingsData): Promise<Poll>{
    this.logger.log(`Attempting to add rankings for user with ID: ${userID} to poll with ID: ${pollID}`, rankings);

    const key = `polls:${pollID}`;
    const rankingsPath = `.rankings.${userID}`;

    try {
      await this.redisClient.send_command('JSON.SET', key, rankingsPath, JSON.stringify(rankings)); 
      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(`Failed to add rankings for user with ID: ${userID} to poll with ID: ${pollID}`, e);
      throw new InternalServerErrorException('There was an error starting the poll');
    }
  } 

  async addResults(pollID: string, results: Results): Promise<Poll> {
    this.logger.log(`Attempting to add results for poll with ID: ${pollID}`, results);

    const key = `polls:${pollID}`;
    const resultsPath = '.results';

    try {
      await this.redisClient.send_command('JSON.SET', key, resultsPath, JSON.stringify(results));
      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(`Failed to add results for poll with ID: ${pollID}`, e);
      throw new InternalServerErrorException('There was an error adding the results');
    }
  }

  async deletePoll(pollID: string): Promise<void> {
    this.logger.log(`Attempting to delete poll with ID: ${pollID}`);

    const key = `polls:${pollID}`;

    try {
      await this.redisClient.send_command('DEL', key);
    } catch (e) {
      this.logger.error(`Failed to delete poll with ID: ${pollID}`, e);
      throw new InternalServerErrorException(`Failed to delete poll with ID: ${pollID}`);
    }
  }
}
