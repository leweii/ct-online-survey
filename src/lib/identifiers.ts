/**
 * Identifier generation utilities for surveys and creators
 */

// Characters for short code generation (excludes confusing: 0, O, 1, I, L)
const SHORT_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// Chinese pet names - whimsical, cute, not like real human names
const CHINESE_PET_NAMES = [
  // 叠词类 (Reduplication)
  "胖墩墩", "毛球球", "咕噜噜", "嘟嘟", "团团", "圆圆", "泡泡", "豆豆", "糖糖", "果果",
  // 食物类 (Food-themed)
  "小土豆", "皮蛋", "年糕", "汤圆", "小笼包", "馒头", "饺子", "包子", "烧麦", "春卷",
  "麻薯", "布丁", "奶酪", "薯条", "鸡腿", "肉丸", "虾饺", "蛋挞", "麻花", "油条",
  // 动物昵称 (Animal nicknames)
  "小肥猪", "懒羊羊", "呆萌鸡", "二哈", "橘猫", "奶牛", "小鹦鹉", "胖企鹅", "萌兔兔", "小刺猬",
  // 拟声词 (Onomatopoeia)
  "喵喵", "汪汪", "叽叽", "咩咩", "哞哞", "嘎嘎", "咕咕", "吱吱", "呱呱", "嗡嗡",
  // 可爱形容词+名词 (Cute adj+noun)
  "小胖子", "肉肉", "糯米糍", "小泡芙", "棉花糖", "软糖", "果冻", "奶茶", "芋圆", "西米露",
];

// English pet names - silly, whimsical, pet-like
const ENGLISH_PET_NAMES = [
  // Food names
  "Nugget", "Biscuit", "Pudding", "Muffin", "Pickle", "Waffles", "Pancake", "Noodle", "Taco", "Pretzel",
  "Dumpling", "Cookie", "Brownie", "Cupcake", "Jellybean", "Marshmallow", "Peanut", "Cashew", "Pistachio", "Walnut",
  // Silly titles
  "Mr.Wobbles", "Sir.Fluffington", "Captain.Snuggles", "Dr.Whiskers", "Baron.Boop", "Count.Fuzzy", "Duke.Waddles", "Lord.Pudge",
  // Texture/appearance
  "Fluffkins", "Fuzzbucket", "Butterball", "Chonkers", "Chunky", "Tubbs", "Squish", "Puffball", "Pompom", "Furball",
  // Sound-based
  "Squeaky", "Snorty", "Grunty", "Chirpy", "Peppy", "Zippy", "Bouncy", "Wiggles", "Giggles", "Bubbles",
];

/**
 * Generate a random short code of specified length
 */
function generateShortCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SHORT_CODE_CHARS[Math.floor(Math.random() * SHORT_CODE_CHARS.length)];
  }
  return code;
}

/**
 * Generate a unique short code with adaptive length
 * Starts at 4 chars, increases up to 8 if collisions persist
 */
export async function generateUniqueShortCode(db: any): Promise<string> {
  let length = 4;
  const maxLength = 8;
  const maxRetries = 10;

  while (length <= maxLength) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = generateShortCode(length);

      // Check if code exists (case-insensitive)
      const { data } = await db
        .from("surveys")
        .select("id")
        .ilike("short_code", code)
        .maybeSingle();

      if (!data) {
        return code; // Unique code found
      }
    }
    // All retries failed at this length, increase length
    length++;
  }

  throw new Error("Unable to generate unique short code");
}

/**
 * Generate a random creator name from the pet name pool
 */
function getRandomPetName(language: string): string {
  const pool = language === "zh" ? CHINESE_PET_NAMES : ENGLISH_PET_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generate a unique creator name
 * Always appends random digits to avoid collisions
 */
export async function generateUniqueCreatorName(
  db: any,
  language: string = "zh"
): Promise<string> {
  const maxRetries = 10;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const baseName = getRandomPetName(language);
    const suffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const name = `${baseName}${suffix}`;

    // Check if name exists
    const { data } = await db
      .from("surveys")
      .select("id")
      .eq("creator_name", name)
      .maybeSingle();

    if (!data) {
      return name; // Unique name found
    }
  }

  // Fallback: use timestamp for guaranteed uniqueness
  const baseName = getRandomPetName(language);
  return `${baseName}${Date.now() % 10000}`;
}

/**
 * Check if a string looks like a UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if a string looks like a short code (4-8 alphanumeric chars)
 */
export function isShortCode(str: string): boolean {
  const shortCodeRegex = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4,8}$/i;
  return shortCodeRegex.test(str);
}
