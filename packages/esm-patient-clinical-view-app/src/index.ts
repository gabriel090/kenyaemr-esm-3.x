import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import { createDashboardLink, registerWorkspace } from '@openmrs/esm-patient-common-lib';
import { dashboardMeta } from './dashboard.meta';

const moduleName = '@kenyaemr/esm-patient-clinical-view-app';

const options = {
  featureName: 'patient-clinical-view-app',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');
export const advancedAdherenceLink = getSyncLifecycle(createDashboardLink({ ...dashboardMeta, moduleName }), options);
export const advancedAdherence = getAsyncLifecycle(
  () => import('./enhanced-adherence/enhanced-adherence.components'),
  options,
);
export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}
