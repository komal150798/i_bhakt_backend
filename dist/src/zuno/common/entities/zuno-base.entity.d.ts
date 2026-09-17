export declare abstract class ZunoBaseEntity {
    id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
export declare abstract class ZunoVersionedEntity extends ZunoBaseEntity {
    version: number;
}
export declare abstract class ZunoImmutableEntity {
    id: string;
    created_at: Date;
    redacted_at: Date | null;
}
