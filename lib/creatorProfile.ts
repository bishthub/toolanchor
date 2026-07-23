// ─────────────────────────────────────────────────────────────────────────
// Shared "creator profile" for the auto-fill tools (Google Form Auto-Filler,
// Invoice Auto-Filler). One localStorage record holds the details a UGC
// creator types into every brand form and invoice — name, socials, UPI, PAN,
// bank account — so tools can fill them automatically. Never leaves the
// device.
// ─────────────────────────────────────────────────────────────────────────

export interface CreatorProfile {
  fullName: string;
  email: string;
  phone: string;
  dob: string; // yyyy-mm-dd
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  instagram: string;
  youtube: string;
  followers: string;
  subscribers: string;
  portfolio: string;
  upi: string;
  pan: string;
  gstin: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  rate: string;
  bio: string;
}

export type ProfileKey = keyof CreatorProfile;

export const EMPTY_PROFILE: CreatorProfile = {
  fullName: "", email: "", phone: "", dob: "", gender: "",
  address: "", city: "", state: "", country: "", pincode: "",
  instagram: "", youtube: "", followers: "", subscribers: "", portfolio: "",
  upi: "", pan: "", gstin: "",
  bankName: "", accountHolder: "", accountNumber: "", ifsc: "",
  rate: "", bio: "",
};

const STORAGE_KEY = "ta:creator-profile";
export const PROFILE_EVENT = "ta:creator-profile";

export function getProfile(): CreatorProfile {
  if (typeof window === "undefined") return { ...EMPTY_PROFILE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...EMPTY_PROFILE };
}

export function saveProfile(p: CreatorProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    window.dispatchEvent(new Event(PROFILE_EVENT));
  } catch { /* ignore */ }
}

export function profileFieldCount(p: CreatorProfile): number {
  return (Object.keys(p) as ProfileKey[]).filter((k) => p[k].trim() !== "").length;
}

/** Age in years derived from dob, or "" if unset/invalid. */
export function profileAge(p: CreatorProfile): string {
  if (!p.dob) return "";
  const d = new Date(p.dob);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age > 0 && age < 120 ? String(age) : "";
}

// ── Label → profile-field matching ────────────────────────────────────────
// Ordered rules: the FIRST matching rule wins, so specific labels ("bank
// name", "account holder name") are listed before generic ones ("name").

export interface MatchRule { key: ProfileKey | "age"; re: RegExp }

export const MATCH_RULES: MatchRule[] = [
  { key: "accountHolder", re: /account\s*holder|holder'?s?\s*name|name\s*(as\s*per|on)\s*(the\s*)?(bank|account|passbook|cheque)|beneficiary\s*name/i },
  { key: "bankName", re: /bank'?s?\s*name|name\s*of\s*(the\s*)?bank|bank\s*&?\s*branch/i },
  { key: "accountNumber", re: /account\s*(no|num|number|#)|a\/?c\s*\.?\s*(no|num|number)|bank\s*account/i },
  { key: "ifsc", re: /ifsc|ifs\s*code|swift/i },
  { key: "upi", re: /\bupi\b|gpay|g-?pay\s*(id|number)?|google\s*pay|phone\s*pe|phonepe|paytm/i },
  { key: "pan", re: /\bpan\b/i },
  { key: "gstin", re: /\bgst/i },
  { key: "youtube", re: /you\s*tube|\byt\b|channel\s*(link|url|name|id)/i },
  { key: "subscribers", re: /subscriber/i },
  { key: "instagram", re: /insta|\big\b|reels?\s*(handle|profile|link)|social\s*media|social\s*(handle|profile|link|url|id)|user\s*name|username|\bhandle\b/i },
  { key: "followers", re: /follower/i },
  { key: "portfolio", re: /portfolio|website|\bblog\b|work\s*samples?|drive\s*link/i },
  { key: "email", re: /e-?mail/i },
  { key: "phone", re: /phone|mobile|whats\s*app|whatsapp|contact\s*(no|num|number)|calling\s*number/i },
  { key: "dob", re: /date\s*of\s*birth|\bdob\b|birth\s*date|birthday/i },
  { key: "age", re: /\bage\b/i },
  { key: "gender", re: /gender|\bsex\b/i },
  // Address BEFORE pincode: "Complete Address with Pincode" is an address.
  { key: "address", re: /address|shipping|delivery\s*(location|details)/i },
  { key: "pincode", re: /pin\s*code|pincode|\bzip\b|postal\s*code/i },
  { key: "city", re: /city|town|which\s*place|location/i },
  { key: "state", re: /\bstate\b(?!.*name)/i },
  { key: "country", re: /country|nationality/i },
  { key: "rate", re: /rate\s*card|your\s*rates?|charges?|\bfees?\b|pricing|compensation\s*expect|budget\s*expect|expected\s*(pay|amount|compensation)/i },
  { key: "bio", re: /about\s*(you|yourself|me)|\bbio\b|introduce|introduction|describe\s*yourself/i },
  // Generic name LAST — and only when it isn't some other entity's name.
  { key: "fullName", re: /\bname\b/i },
];

const NAME_EXCLUDE = /brand|company|business|father|mother|parent|product|campaign|agency|shop|store|page\s*name|team/i;

/** Best profile field for a free-text label/question, or null. */
export function matchLabel(label: string): ProfileKey | "age" | null {
  const l = label.toLowerCase();
  for (const rule of MATCH_RULES) {
    if (!rule.re.test(l)) continue;
    if (rule.key === "fullName" && NAME_EXCLUDE.test(l)) continue;
    return rule.key;
  }
  return null;
}

/** Value for a matched key (handles the derived "age" pseudo-field). */
export function valueFor(p: CreatorProfile, key: ProfileKey | "age"): string {
  if (key === "age") return profileAge(p);
  return p[key] ?? "";
}

// ── Placeholder aliases ({{name}}, [UPI ID], …) for the document filler ──
// Keys are normalized: lowercase, alphanumerics only.

export const PLACEHOLDER_ALIASES: Record<string, ProfileKey | "age"> = {
  name: "fullName", fullname: "fullName", yourname: "fullName", creatorname: "fullName",
  sellername: "fullName", freelancername: "fullName",
  email: "email", emailid: "email", emailaddress: "email",
  phone: "phone", phoneno: "phone", phonenumber: "phone", mobile: "phone",
  mobileno: "phone", mobilenumber: "phone", whatsapp: "phone", contact: "phone",
  contactno: "phone", contactnumber: "phone",
  dob: "dob", dateofbirth: "dob", age: "age", gender: "gender",
  address: "address", fulladdress: "address", city: "city", state: "state",
  country: "country", pincode: "pincode", zip: "pincode", zipcode: "pincode", postalcode: "pincode",
  instagram: "instagram", instagramhandle: "instagram", instahandle: "instagram",
  ig: "instagram", ighandle: "instagram", username: "instagram", handle: "instagram",
  youtube: "youtube", youtubechannel: "youtube", channel: "youtube", channellink: "youtube",
  followers: "followers", followercount: "followers", subscribers: "subscribers",
  portfolio: "portfolio", website: "portfolio",
  upi: "upi", upiid: "upi", gpay: "upi", phonepe: "upi", paytm: "upi",
  pan: "pan", panno: "pan", pannumber: "pan", pancard: "pan",
  gst: "gstin", gstin: "gstin", gstno: "gstin", gstnumber: "gstin",
  bank: "bankName", bankname: "bankName",
  accountholder: "accountHolder", accountholdername: "accountHolder", beneficiary: "accountHolder",
  account: "accountNumber", accountno: "accountNumber", accountnumber: "accountNumber",
  acno: "accountNumber", acnumber: "accountNumber", bankaccount: "accountNumber",
  ifsc: "ifsc", ifsccode: "ifsc",
  rate: "rate", ratecard: "rate", charges: "rate", fee: "rate", fees: "rate",
  bio: "bio", about: "bio",
};

export function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
