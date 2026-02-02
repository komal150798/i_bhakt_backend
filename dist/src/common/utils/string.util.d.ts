export declare function formatFullName(firstName: string | null | undefined, lastName: string | null | undefined, fallback?: string): string;
export declare function safeTrim(value: string | null | undefined): string;
export declare function isEmpty(value: string | null | undefined): boolean;
export declare function capitalize(value: string | null | undefined): string;
export declare function splitFullName(fullName: string | null | undefined): {
    first_name: string;
    last_name: string;
};
