import { User } from '../../users/entities/user.entity';
export declare abstract class BaseEntity {
    id: number;
    unique_id: string;
    added_date: Date;
    modify_date: Date;
    is_enabled: boolean;
    is_deleted: boolean;
    added_by: number | null;
    modify_by: number | null;
    addedByUser: User | null;
    modifiedByUser: User | null;
    generateUniqueId(): void;
    updateModifyDate(): void;
}
