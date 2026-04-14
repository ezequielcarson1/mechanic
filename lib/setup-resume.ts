/**
 * Determines the next setup screen to resume based on saved progress.
 *
 * The setup flow saves `lastStep` to AsyncStorage each time the user
 * advances. This module maps that step to the next screen in the flow,
 * accounting for role-specific branching.
 *
 * Flow:
 *   User:     phone → otp → role → basic-info → identity → address → dealer-info → vehicle-info → success
 *   Mechanic: phone → otp → role → basic-info → identity → address → credentials → dealer-info → expertise → availability → success
 */

interface SetupProgress {
  lastStep: string;
  role?: { role: 'user' | 'mechanic' };
  [key: string]: unknown;
}

/** Steps with a single, role-independent next screen */
const LINEAR_STEPS: Record<string, string> = {
  phone: '/setup/otp',
  otp: '/setup/role-selection',
  role: '/setup/basic-info',
  basicInfo: '/setup/identity',
  identity: '/setup/address',
  credentials: '/setup/dealer-info',
  expertise: '/setup/availability',
  availability: '/setup/success',
  vehicles: '/setup/success',
};

/** Steps where the next screen depends on the selected role */
const BRANCHING_STEPS: Record<string, Record<string, string>> = {
  address: {
    user: '/setup/dealer-info',
    mechanic: '/setup/credentials',
  },
  dealerInfo: {
    user: '/setup/vehicle-info',
    mechanic: '/setup/expertise',
  },
};

/**
 * Given the saved setup progress, returns the route the user should
 * resume at — i.e. the screen that follows `lastStep`.
 *
 * Returns null if no resume is needed (no lastStep or unrecognised step).
 */
export function getSetupResumeRoute(progress: SetupProgress): string | null {
  const { lastStep } = progress;
  if (!lastStep) return null;

  // Check role-branching steps first
  if (lastStep in BRANCHING_STEPS) {
    const role = progress.role?.role ?? 'user';
    return BRANCHING_STEPS[lastStep][role] ?? '/setup';
  }

  return LINEAR_STEPS[lastStep] ?? '/setup';
}
