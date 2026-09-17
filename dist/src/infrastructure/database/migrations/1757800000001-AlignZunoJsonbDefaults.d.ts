import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AlignZunoJsonbDefaults1757800000001 implements MigrationInterface {
    name: string;
    private readonly columns;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
