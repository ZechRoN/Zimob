import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'imobflow-template-para-cn40y2gx',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_YQnGw-IJOeSorkyCEl7aUG5D91go3czC',
  authRequired: false,
  auth: { mode: 'managed' },
})
