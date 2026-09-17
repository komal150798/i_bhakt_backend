import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateZunoKarmaLedger1758200000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
    private index;
    private check;
}
