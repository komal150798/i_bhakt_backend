import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class RemoveIbhaktLegacyModules1757900000000 implements MigrationInterface {
    name: string;
    private readonly tables;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
