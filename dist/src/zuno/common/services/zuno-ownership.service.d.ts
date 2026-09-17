export declare class ZunoOwnershipService {
    require<T extends {
        user_id: string;
    }>(entity: T | null | undefined, userId: string, entityLabel: string): T;
    assertVersion(entity: {
        version: number;
    }, expectedVersion: number | undefined): void;
}
