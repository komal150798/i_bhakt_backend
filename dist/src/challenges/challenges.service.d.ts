import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { UserChallenge } from './entities/user-challenge.entity';
export declare class ChallengesService {
    private challengeRepository;
    private userChallengeRepository;
    constructor(challengeRepository: Repository<Challenge>, userChallengeRepository: Repository<UserChallenge>);
    getChallengeById(challengeId: number): Promise<Challenge>;
    getUserChallenge(userId: number, challengeId: number): Promise<UserChallenge>;
    startChallenge(userId: number, challengeId: number): Promise<UserChallenge>;
    markDayComplete(userId: number, challengeId: number, day: number): Promise<UserChallenge>;
    getAvailableChallenges(): Promise<Challenge[]>;
    getUserChallenges(userId: number): Promise<UserChallenge[]>;
}
