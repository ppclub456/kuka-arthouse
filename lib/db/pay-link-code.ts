import { customAlphabet } from "nanoid";

/** Crockford-ish: no 0,O,1,I — 32 symbols, length 6. */
export const PAY_LINK_CODE_ALPHABET =
  "23456789ABCDEFGHJKLMNPQRSTUVW";
export const PAY_LINK_CODE_LENGTH = 6;

export const payLinkNanoid = customAlphabet(
  PAY_LINK_CODE_ALPHABET,
  PAY_LINK_CODE_LENGTH,
);

export function normalizePayLinkCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export const SHORT_PAY_LINK_REGEX = new RegExp(
  `^[${PAY_LINK_CODE_ALPHABET}]{${PAY_LINK_CODE_LENGTH}}$`,
);

export function looksLikeShortPayLinkCode(raw: string): boolean {
  return SHORT_PAY_LINK_REGEX.test(normalizePayLinkCode(raw));
}
