import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { MemoryService } from '../services/memory.service';
import { CorrectMemoryDto, ListMemoryQueryDto, MemoryCandidateView, MemoryView, RejectCandidateDto } from '../dtos/memory.dtos';
export declare class ZunoMemoryController {
    private readonly memory;
    constructor(memory: MemoryService);
    list(user: ZunoUser, query: ListMemoryQueryDto): Promise<MemoryView[]>;
    summary(user: ZunoUser): Promise<import("../entities").MemorySummaryGroup[]>;
    candidates(user: ZunoUser): Promise<MemoryCandidateView[]>;
    confirm(user: ZunoUser, candidateId: string): Promise<MemoryView>;
    reject(user: ZunoUser, candidateId: string, _dto: RejectCandidateDto): Promise<{
        id: string;
        status: import("../enums/memory.enum").MemoryCandidateStatus;
    }>;
    clearChallenge(user: ZunoUser, challengeId: string): Promise<{
        deleted: number;
    }>;
    correct(user: ZunoUser, memoryId: string, dto: CorrectMemoryDto): Promise<MemoryView>;
    remove(user: ZunoUser, memoryId: string): Promise<{
        id: string;
        deleted: boolean;
        stopsInfluencingGuidance: boolean;
    }>;
    history(user: ZunoUser, memoryId: string): Promise<MemoryView[]>;
}
