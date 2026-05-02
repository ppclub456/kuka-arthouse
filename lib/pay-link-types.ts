/** Verified payload shared by JWT (legacy), compact tokens, etc. */
export type PayLinkClaims = {
  amountAud: number;
  title: string;
  mode: string;
  productId?: string;
  /** Order / invoice reference visible to the customer */
  reference?: string;
};
