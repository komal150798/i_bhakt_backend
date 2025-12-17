import { SetMetadata } from '@nestjs/common';

export const MODULE_SLUG_KEY = 'module_slug';
export const ModuleAccess = (moduleSlug: string) => SetMetadata(MODULE_SLUG_KEY, moduleSlug);







