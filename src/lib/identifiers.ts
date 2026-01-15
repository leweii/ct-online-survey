/**
 * Identifier generation utilities for surveys and creators
 */

// Characters for short code generation (excludes confusing: 0, O, 1, I, L)
const SHORT_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// Chinese pet names - whimsical, cute, not like real human names (~500)
const CHINESE_PET_NAMES = [
  // 叠词类 (Reduplication) - 50
  "胖墩墩", "毛球球", "咕噜噜", "嘟嘟", "团团", "圆圆", "泡泡", "豆豆", "糖糖", "果果",
  "萌萌", "乖乖", "宝宝", "贝贝", "甜甜", "蜜蜜", "软软", "糯糯", "暖暖", "乐乐",
  "欢欢", "闹闹", "跳跳", "蹦蹦", "滚滚", "憨憨", "呆呆", "傻傻", "懵懵", "困困",
  "饱饱", "胀胀", "鼓鼓", "肥肥", "壮壮", "棒棒", "酷酷", "帅帅", "美美", "靓靓",
  "亮亮", "闪闪", "晶晶", "莹莹", "盈盈", "悠悠", "优优", "柔柔", "绵绵", "棉棉",

  // 食物类 (Food-themed) - 100
  "小土豆", "皮蛋", "年糕", "汤圆", "小笼包", "馒头", "饺子", "包子", "烧麦", "春卷",
  "麻薯", "布丁", "奶酪", "薯条", "鸡腿", "肉丸", "虾饺", "蛋挞", "麻花", "油条",
  "豆腐", "豆皮", "豆干", "腐竹", "凉粉", "粉条", "米线", "河粉", "肠粉", "煎饼",
  "烙饼", "葱饼", "肉饼", "馅饼", "糖饼", "月饼", "绿豆糕", "桂花糕", "红豆糕", "芝麻糕",
  "花生酥", "核桃酥", "杏仁酥", "蛋黄酥", "老婆饼", "菠萝包", "奶黄包", "流沙包", "叉烧包", "莲蓉包",
  "冰皮", "雪媚娘", "大福", "铜锣烧", "鲷鱼烧", "华夫饼", "可颂", "贝果", "司康", "玛芬",
  "提拉米苏", "慕斯", "舒芙蕾", "千层", "拿破仑", "黑森林", "草莓卷", "瑞士卷", "虎皮卷", "毛巾卷",
  "奶冻", "双皮奶", "姜撞奶", "杨枝甘露", "芒果捞", "红豆沙", "绿豆沙", "芝麻糊", "花生糊", "杏仁露",
  "酸奶", "奶昔", "冰沙", "刨冰", "绵绵冰", "雪花冰", "炒冰", "冰棍", "雪糕", "甜筒",
  "珍珠", "椰果", "仙草", "芋圆", "西米", "红豆", "绿豆", "薏米", "燕麦", "紫米",

  // 动物昵称 (Animal nicknames) - 80
  "小肥猪", "懒羊羊", "呆萌鸡", "二哈", "橘猫", "奶牛", "小鹦鹉", "胖企鹅", "萌兔兔", "小刺猬",
  "肥柴", "柯基", "法斗", "巴哥", "泰迪", "贵宾", "萨摩", "哈士奇", "金毛", "拉布拉多",
  "布偶", "英短", "美短", "蓝猫", "暹罗", "波斯", "缅因", "无毛猫", "折耳", "狸花",
  "小仓鼠", "小龙猫", "小松鼠", "小花栗", "土拨鼠", "水豚", "羊驼", "袋鼠", "考拉", "树懒",
  "小海豹", "小海獭", "小海狮", "小白鲸", "小海豚", "小鲨鱼", "小章鱼", "小水母", "小海星", "小螃蟹",
  "小蜗牛", "小瓢虫", "小蝴蝶", "小蜻蜓", "小蜜蜂", "小蚂蚁", "小青蛙", "小蝌蚪", "小乌龟", "小蜥蜴",
  "小麻雀", "小燕子", "小黄鹂", "小喜鹊", "小鸽子", "小鸭子", "小天鹅", "小火烈鸟", "小孔雀", "小猫头鹰",
  "小熊猫", "小浣熊", "小狐狸", "小狼崽", "小狮子", "小老虎", "小豹子", "小象", "小长颈鹿", "小河马",

  // 拟声词 (Onomatopoeia) - 40
  "喵喵", "汪汪", "叽叽", "咩咩", "哞哞", "嘎嘎", "咕咕", "吱吱", "呱呱", "嗡嗡",
  "啾啾", "咿咿", "呀呀", "哇哇", "嘻嘻", "哈哈", "嘿嘿", "呵呵", "噗噗", "扑扑",
  "嘟嘟", "哔哔", "滴滴", "嗒嗒", "咚咚", "砰砰", "噼噼", "啪啪", "哗哗", "沙沙",
  "呼呼", "嗖嗖", "咻咻", "轰轰", "隆隆", "淅淅", "沥沥", "簌簌", "飒飒", "瑟瑟",

  // 可爱形容词+名词 (Cute adj+noun) - 60
  "小胖子", "肉肉", "糯米糍", "小泡芙", "棉花糖", "软糖", "果冻", "奶茶", "芋圆", "西米露",
  "小可爱", "小甜心", "小宝贝", "小天使", "小福星", "小太阳", "小月亮", "小星星", "小云朵", "小彩虹",
  "小糖果", "小饼干", "小蛋糕", "小面包", "小馒头", "小包子", "小丸子", "小团子", "小圆子", "小汤圆",
  "小橘子", "小柠檬", "小草莓", "小樱桃", "小葡萄", "小西瓜", "小蜜桃", "小芒果", "小椰子", "小菠萝",
  "小南瓜", "小冬瓜", "小萝卜", "小白菜", "小青菜", "小蘑菇", "小木耳", "小银耳", "小花生", "小核桃",
  "小辣椒", "小番茄", "小黄瓜", "小茄子", "小豆芽", "小玉米", "小毛豆", "小豌豆", "小扁豆", "小红薯",

  // 植物花草类 (Plants & Flowers) - 50
  "小绿芽", "小嫩芽", "小豆苗", "小花苞", "小花蕾", "小花瓣", "小叶子", "小树苗", "小树枝", "小树芽",
  "小玫瑰", "小百合", "小茉莉", "小栀子", "小桂花", "小梅花", "小桃花", "小樱花", "小杏花", "小梨花",
  "小荷花", "小莲花", "小睡莲", "小兰花", "小菊花", "小向日葵", "小郁金香", "小牡丹", "小芍药", "小海棠",
  "小仙人掌", "小多肉", "小绿萝", "小吊兰", "小文竹", "小富贵竹", "小发财树", "小龟背竹", "小虎皮兰", "小芦荟",
  "小薄荷", "小罗勒", "小迷迭香", "小薰衣草", "小紫苏", "小艾草", "小蒲公英", "小三叶草", "小四叶草", "小含羞草",

  // 天气自然类 (Weather & Nature) - 40
  "小雨滴", "小雪花", "小冰晶", "小露珠", "小霜花", "小雾气", "小云彩", "小霞光", "小晨曦", "小晚霞",
  "小春风", "小夏雨", "小秋叶", "小冬雪", "小微风", "小清风", "小暖风", "小凉风", "小和风", "小轻风",
  "小溪流", "小河水", "小湖泊", "小海浪", "小泉水", "小瀑布", "小水滴", "小水珠", "小水泡", "小涟漪",
  "小石头", "小沙粒", "小贝壳", "小珊瑚", "小珍珠", "小琥珀", "小玛瑙", "小翡翠", "小水晶", "小钻石",

  // 颜色物品类 (Color + Items) - 40
  "小粉团", "小红豆", "小橙子", "小黄鸭", "小绿豆", "小青梅", "小蓝莓", "小紫薯", "小白兔", "小黑猫",
  "粉嘟嘟", "红彤彤", "黄灿灿", "绿油油", "蓝盈盈", "紫莹莹", "白胖胖", "黑溜溜", "灰蒙蒙", "金闪闪",
  "小红帽", "小蓝帽", "小黄帽", "小绿帽", "小粉帽", "小紫帽", "小白帽", "小黑帽", "小花帽", "小草帽",
  "小红球", "小蓝球", "小黄球", "小绿球", "小粉球", "小紫球", "小白球", "小黑球", "小花球", "小毛球",

  // 物品玩具类 (Items & Toys) - 40
  "小枕头", "小被子", "小毯子", "小抱枕", "小靠垫", "小坐垫", "小沙发", "小摇椅", "小秋千", "小吊床",
  "小风车", "小风筝", "小气球", "小泡泡", "小烟花", "小灯笼", "小蜡烛", "小火柴", "小火花", "小星光",
  "小铃铛", "小哨子", "小喇叭", "小鼓", "小锣", "小琴", "小笛", "小箫", "小号", "小提琴",
  "小积木", "小拼图", "小魔方", "小陀螺", "小弹珠", "小沙包", "小毽子", "小皮球", "小飞盘", "小风铃",

  // 日常生活类 (Daily Life) - 40
  "小书包", "小铅笔", "小橡皮", "小尺子", "小剪刀", "小胶水", "小贴纸", "小印章", "小本子", "小卡片",
  "小杯子", "小碗", "小盘子", "小勺子", "小筷子", "小叉子", "小刀叉", "小茶壶", "小水壶", "小保温杯",
  "小帽子", "小围巾", "小手套", "小袜子", "小鞋子", "小背包", "小挎包", "小钱包", "小口袋", "小纽扣",
  "小眼镜", "小耳环", "小项链", "小手链", "小戒指", "小发卡", "小发圈", "小蝴蝶结", "小领结", "小徽章",
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
