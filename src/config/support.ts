/* ─────────────────────────────────────────────────────────────
   تنظیمات حمایت — تنها جای شماره کارت و راه‌های حمایت.
   مالک: فقط همین فایل را عوض کن.
   - تا وقتی خالی است، سایت حالت صادقانه‌ی «هنوز راه پرداخت ندارد»
     را نشان می‌دهد و هیچ شماره‌ای اختراع نمی‌شود.
   - برای فعال شدن، فیلدها را با اطلاعات واقعی خودت پر کن:
       SUPPORT_CARD = { number: "6037ोध...", bank: "...", holder: "..." }
     فاصله و خط‌تیره مهم نیست؛ نمایش خودکار گروه‌بندی می‌شود.
   ───────────────────────────────────────────────────────────── */

export type SupportMethod = {
  label: string;
  href: string;
  note?: string;
};

export const SUPPORT_METHODS: SupportMethod[] = [
  // Owner: add real support links here. Empty = honest empty state.
];

export type SupportCard = {
  /** شماره کارت — فقط رقم؛ خالی یعنی «هنوز تنظیم نشده». مثال: "6037991234567890" */
  number: string;
  /** نام بانک، مثلا "بانک ملی" */
  bank: string;
  /** نام صاحب کارت، مثلا "دانیال رشیدی" */
  holder: string;
};

export const SUPPORT_CARD: SupportCard = {
  number: "6219861842274689",
  bank: "",
  holder: "دانیال رشیدی",
};

export function isSupportCardConfigured(card: SupportCard): boolean {
  return card.number.replace(/[\s-]/g, "").length >= 8;
}

export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 20);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}
