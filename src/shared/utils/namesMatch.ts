const NICKNAME_GROUPS: string[][] = [
  ["daniel", "dan", "danny"],
  ["william", "will", "bill", "billy", "liam"],
  ["robert", "rob", "bob", "bobby", "robbie"],
  ["richard", "rick", "rich", "dick", "richie"],
  ["james", "jim", "jimmy", "jamie"],
  ["john", "jon", "jack", "johnny"],
  ["michael", "mike", "mick", "mikey"],
  ["matthew", "matt"],
  ["thomas", "tom", "tommy"],
  ["christopher", "chris"],
  ["anthony", "tony"],
  ["joseph", "joe", "joey"],
  ["samuel", "sam", "sammy"],
  ["benjamin", "ben", "benny"],
  ["alexander", "alex", "xander"],
  ["nicholas", "nick", "nicky"],
  ["jonathan", "jon", "jonny"],
  ["andrew", "andy", "drew"],
  ["edward", "ed", "eddie", "ted"],
  ["elizabeth", "liz", "beth", "betty", "lizzie"],
  ["katherine", "kathryn", "catherine", "kate", "katie", "kathy"],
  ["jennifer", "jen", "jenny"],
  ["rebecca", "becca", "becky"],
  ["stephen", "steven", "steve"],
  ["timothy", "tim", "timmy"],
  ["patrick", "pat", "paddy"]
];

const NICKNAME_LOOKUP = new Map<string, Set<number>>();
NICKNAME_GROUPS.forEach((group, i) => {
  for (const n of group) {
    const set = NICKNAME_LOOKUP.get(n) ?? new Set<number>();
    set.add(i);
    NICKNAME_LOOKUP.set(n, set);
  }
});

interface ParsedName {
  first: string;
  last: string | null;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function parseName(name: string): ParsedName | null {
  let clean = name.replace(/\s*<.*$/, "").trim();
  if (!clean) {
    return null;
  }

  const comma = clean.indexOf(",");
  if (comma >= 0) {
    // "Turner, William E" -> "William E Turner"
    clean = `${clean.slice(comma + 1)} ${clean.slice(0, comma)}`;
  }

  const tokens = tokenize(clean);
  if (tokens.length === 0) {
    return null;
  }
  return { first: tokens[0]!, last: tokens.length > 1 ? tokens[tokens.length - 1]! : null };
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length || i === b.length) return true; // differ by at most a trailing char
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1); // substitution
  const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
  return longer.slice(i + 1) === shorter.slice(i); // insertion/deletion
}

function sharesNicknameGroup(a: string, b: string): boolean {
  const ga = NICKNAME_LOOKUP.get(a);
  const gb = NICKNAME_LOOKUP.get(b);
  if (!ga || !gb) return false;
  for (const g of ga) {
    if (gb.has(g)) return true;
  }
  return false;
}

function firstNamesMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length === 1 || b.length === 1) return a[0] === b[0]; // initial
  if (sharesNicknameGroup(a, b)) return true;
  return Math.min(a.length, b.length) >= 4 && editDistanceAtMostOne(a, b); // typo
}

function lastNamesMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length === 1 || b.length === 1) return a[0] === b[0]; // initial
  return Math.min(a.length, b.length) >= 5 && editDistanceAtMostOne(a, b);
}

/**
 * Loose person-name comparison. Handles initials, nicknames, prefixes, small
 * typos, ignored middle names, "Last, First" order and trailing "<email>".
 */
export function namesMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const pa = parseName(a);
  const pb = parseName(b);
  if (!pa || !pb) return false;

  if (!firstNamesMatch(pa.first, pb.first)) return false;
  if (pa.last === null || pb.last === null) return true;
  return lastNamesMatch(pa.last, pb.last);
}
