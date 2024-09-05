import { defineConfig } from 'vite';
import { PollsRepository } from './polls.repository';
import { Injectable, Logger } from '@nestjs/common';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';
import { createPollID, createUserID } from 'src/ids';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PollsService {
  constructor(
    private readonly PollsRepository: PollsRepository,
    private readonly jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(PollsService.name);
  async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    const createdPoll = await this.PollsRepository.CreatePoll({
      ...fields,
      userID,
      pollID,
    });

    //create an accessToken based off of pollID and userID
    this.logger.debug(
      `Creating token string for pollID: ${createdPoll.id} and userID: ${userID}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollID: createdPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );
    return {
      poll: createdPoll,
      accessToken: signedString,
    };
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = createUserID();

    this.logger.debug(
      `Fetching poll with ID: ${fields.pollID} for user with ID: ${userID}`,
    );
    const joinedPoll = await this.PollsRepository.getPoll(fields.pollID);

    //create access Token
    this.logger.debug(
      `Creating token string for pollID: ${joinedPoll.id} and userID: ${userID}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollID: joinedPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );
    return {
      poll: joinedPoll,
      accessToken: signedString,
    };
  }

  async rejoinPoll(fields: RejoinPollFields) {
    this.logger.debug(
      `Rejoining poll with ID: ${fields.pollID} for user with ID: ${fields.userID} with name: ${fields.name}`,
    );
    //thêm thành viên
    const joinedPoll = await this.PollsRepository.AddParticipant(fields);

    return joinedPoll;
  }
}
