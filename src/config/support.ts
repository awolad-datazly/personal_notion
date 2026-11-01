export const SUPPORT_CONFIG = {
  amountBdt: Number(process.env.NEXT_PUBLIC_BKASH_AMOUNT ?? "20"),
  phoneNumber: process.env.NEXT_PUBLIC_BKASH_NUMBER ?? "01XXXXXXXXX",
  qrImageUrl: process.env.NEXT_PUBLIC_BKASH_QR_URL ?? "",
  label: "Support",
} as const;
