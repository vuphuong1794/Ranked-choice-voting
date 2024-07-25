import { PollsRepository } from './polls.repository';
import { Injectable, Logger } from '@nestjs/common';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';
import { createPollID, createUserID } from 'src/ids';

@Injectable()
export class PollsService {
  constructor(private readonly PollsRepository: PollsRepository) {}
  private readonly logger = new Logger(PollsService.name);
  async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    const createdPoll = await this.PollsRepository.CreatePoll({
      ...fields,
      userID,
      pollID,
    });
    //TODO - create an accessToken based off of pollID and userID

    return {
      poll: createdPoll,
      //accessToken
    };
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = createUserID();

    this.logger.debug(
      `Fetching poll with ID: ${fields.pollID} for user with ID: ${userID}`,
    );
    const joinedPoll = await this.PollsRepository.getPoll(fields.pollID);

    //TODO - create access Token

    return {
      poll: joinedPoll,
      //accessToken: signedString,
    };
  }

  async rejoinPoll(fields: RejoinPollFields) {
    this.logger.debug(
      `Rejoining poll with ID: ${fields.pollID} for user with ID: ${fields.userID} with name: ${fields.name}`,
    );
    const joinedPoll = await this.PollsRepository.AddParticipant(fields);

    return joinedPoll;
  }
}
