/* ─────────────────────────────────────────────────────────────
   تنها فایل تنظیمات هویتی سایت — همه‌ی لینک‌ها از این‌جا می‌آیند.
   مالک: فقط همین فایل را عوض کن؛ همه‌جا (هیرو، فوتر، ارتباط،
   اینستاگرام، ماست‌هد) خودکار به‌روز می‌شود. چیزی را در کامپوننت‌ها
   دستی عوض نکن. عدد کارت بانکی این‌جا نیست — در src/config/support.ts.
   ───────────────────────────────────────────────────────────── */

export const SITE = {
  name: "دانیال رشیدی",
  latinName: "Danial Rashidi",
  domain: "https://danialrashidi.ir",
  lang: "fa",
  dir: "rtl" as const,
  tagline: "نرم‌افزار، محصول و سفر",
  ogImage: "/images/og-cover.jpg",
  ogImageAlt: "کارت معرفی دانیال رشیدی — نرم‌افزار، محصول و سفر · danialrashidi.ir",
  description:
    "دانیال رشیدی هستم؛ نرم‌افزار و محصول می‌سازم — از ایده‌ی مبهم تا سیستمِ در حال کار. پروژه‌ها، سفرها و راه‌های ارتباط این‌جاست.",
  email: "imdanialrashidi@gmail.com",
  github: "https://github.com/imdanialrashidi",
  githubHandle: "imdanialrashidi",
  englishSite: "https://imdanialrashidi.github.io",
  englishLabel: "imdanialrashidi.github.io",
  telegram: "https://t.me/imdanialrashidi",
  telegramHandle: "@imdanialrashidi",
  instagram: "https://instagram.com/imdanialrashidi",
  instagramHandle: "@imdanialrashidi",
  x: "https://x.com/imdanialrashidi",
  xHandle: "@imdanialrashidi",
} as const;

/* پروفایل شخصی — عکس هیرو و درباره از این‌جا می‌آید.
   مالک: فایل عکس را در public/images/ بگذار و فقط همین خط را عوض کن. */
export const PROFILE = {
  photoSrc: "/images/Danial_photo.jpg",
  photoAlt: "پرتره‌ی دانیال رشیدی",
  location: "ایران",
  availability: "باز برای پروژه‌ی جدید",
  availabilityNote: "معمولاً یکی دو روزه جواب می‌دهم",
  nowDoing: "این روزها روی محصول مستقل و ابزار زبان کار می‌کنم",
  interests: ["کوه و کمپ", "سفر", "موسیقی", "عکاسی خیابانی"],
} as const;

export type SocialId = "email" | "telegram" | "github" | "instagram" | "x" | "website";

export type SocialLink = {
  id: SocialId;
  label: string;
  href: string;
  handle: string;
  ltr?: boolean;
};

/* ترتیب نمایش آیکن‌ها در هیرو/فوتر/ارتباط — از همین‌جا می‌آید. */
export const SOCIALS: SocialLink[] = [
  { id: "telegram", label: "تلگرام", href: SITE.telegram, handle: SITE.telegramHandle, ltr: true },
  { id: "github", label: "گیت‌هاب", href: SITE.github, handle: `github.com/${SITE.githubHandle}`, ltr: true },
  { id: "instagram", label: "اینستاگرام", href: SITE.instagram, handle: SITE.instagramHandle, ltr: true },
  { id: "x", label: "ایکس", href: SITE.x, handle: SITE.xHandle, ltr: true },
  { id: "email", label: "ایمیل", href: `mailto:${SITE.email}`, handle: SITE.email, ltr: true },
  { id: "website", label: "وب انگلیسی", href: SITE.englishSite, handle: SITE.englishLabel, ltr: true },
];

export type NavItem = { href: string; label: string };

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "خانه" },
  { href: "/درباره/", label: "درباره" },
  { href: "/پروژه‌ها/", label: "پروژه‌ها" },
  { href: "/سفرها/", label: "سفرها" },
  { href: "/ارتباط/", label: "ارتباط" },
];

export const SUPPORT_HREF = "/حمایت/";
