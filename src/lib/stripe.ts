import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const PLAN_LIMITS = {
  free:    { postsPerMonth: 5,        linkedinAccounts: 1 },
  pro:     { postsPerMonth: Infinity, linkedinAccounts: 1 },
  creator: { postsPerMonth: Infinity, linkedinAccounts: 3 },
};
