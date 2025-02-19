export type Participants = {
  [participantID: string]: string;
}

export type Nomination = {
  userID: string;
  text: string;
}

export type Nominations = {
  [nominationID: string]: Nomination;
}

export type Poll = {
  id: string;
  topic: string;
  votesPerVoter: number;
  participants: Participants;
  adminID: string;
  nominations: Nominations;
  hasStarted: boolean;
}