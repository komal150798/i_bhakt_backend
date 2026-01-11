export declare const AppConstants: {
    API_CATEGORY: {
        api_type: string;
        category_name: string;
        description: string;
    }[];
    MANIFESTATION_ENTRY_TYPES: {
        value: string;
        label: string;
        description: string;
    }[];
    JOURNAL_ENTRY_TYPES: {
        value: string;
        label: string;
        description: string;
    }[];
    ENERGY_STATES: {
        value: string;
        label: string;
        description: string;
    }[];
    MANIFESTATION_CATEGORIES: {
        value: string;
        label: string;
        icon: string;
    }[];
    KARMA_ACTION_TYPES: {
        value: string;
        label: string;
        description: string;
    }[];
    USER_ROLES: {
        value: string;
        label: string;
        description: string;
    }[];
    SUBSCRIPTION_STATUS: {
        value: string;
        label: string;
        description: string;
    }[];
    LLM_PROVIDERS: {
        value: string;
        label: string;
        description: string;
    }[];
    PROMPT_TYPES: {
        value: string;
        label: string;
        description: string;
    }[];
    CONSTANT_CATEGORIES: {
        value: string;
        label: string;
        description: string;
    }[];
};
export declare function getStaticConstant(category: keyof typeof AppConstants, key?: string): any;
export declare function getAllStaticConstants(category: keyof typeof AppConstants): any[];
export declare function hasStaticConstant(category: keyof typeof AppConstants, value: string, field?: string): boolean;
export default AppConstants;
