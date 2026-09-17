import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateZunoScenario1758400000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
    private addCheck;
}
