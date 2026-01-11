import { TwinStateService } from '../services/twin-state.service';
export declare class AppTwinController {
    private readonly twinStateService;
    constructor(twinStateService: TwinStateService);
    getTwinState(user: any): Promise<{
        success: boolean;
        data: import("../services/twin-state.service").TwinState;
    }>;
}
