import { AsyncLocalStorage } from 'async_hooks';

export const tenantContext = new AsyncLocalStorage();

export const getSchoolId = () => tenantContext.getStore()?.schoolId;
export const getTenantStore = () => tenantContext.getStore();
