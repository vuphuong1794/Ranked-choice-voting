import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreatePollDto, JoinPollDto } from './dto';
import { PollsService } from './polls.service';

@UsePipes(new ValidationPipe())
@Controller('polls')
export class PollsController {
  constructor(private pollsService: PollsService) {}

  @Post()
  async create(@Body() CreatePollDto: CreatePollDto) {
    const result = await this.pollsService.createPoll(CreatePollDto);
    return result;
  }

  @Post('/join')
  async join(@Body() JoinPollDto: JoinPollDto) {
    const result = await this.pollsService.joinPoll(JoinPollDto);
    return result;
  }

  @Post('/rejoin')
  async rejoin() {
    const result = await this.pollsService.rejoinPoll({
      name: 'From token',
      pollID: 'Also from token',
      userID: 'Gues where this comes from',
    });

    return result;
  }
}
