import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateZunoMemory1758500000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
    private addCheck;
    private addForeignKey;
    private tableExists;
}
