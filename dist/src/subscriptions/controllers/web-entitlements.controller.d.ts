import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { EntitlementsService } from '../services/entitlements.service';
export declare class WebEntitlementsController {
    private readonly entitlementsService;
    constructor(entitlementsService: EntitlementsService);
    getEntitlements(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: import("../services/entitlements.service").UserEntitlements;
    }>;
    checkFeatureAccess(user: CurrentUserPayload, feature: string): Promise<{
        success: boolean;
        data: {
            feature: string;
            allowed: boolean;
        };
    }>;
}
