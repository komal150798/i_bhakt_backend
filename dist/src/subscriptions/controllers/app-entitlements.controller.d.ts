import { EntitlementsService } from '../services/entitlements.service';
export declare class AppEntitlementsController {
    private readonly entitlementsService;
    constructor(entitlementsService: EntitlementsService);
    getEntitlements(user: any): Promise<{
        success: boolean;
        data: import("../services/entitlements.service").UserEntitlements;
    }>;
    checkFeatureAccess(user: any, feature: string): Promise<{
        success: boolean;
        data: {
            feature: string;
            allowed: boolean;
        };
    }>;
}
