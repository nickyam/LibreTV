// 全局常量配置
// 路径里的 v2 是代理缓存版本号，必须与 functions/proxy/[[path]].js 的 PROXY_PATH_PREFIX 一致。
// 改动原因：v1 时期代理把二进制按 UTF-8 解码后写进了 KV 和 CDN（键为完整 URL），
// 换路径可以立刻绕开这些投毒缓存，不必等 31 天过期，也不必清 Cloudflare 缓存。
const PROXY_URL = '/proxy/v2/';    // 适用于 Cloudflare, Netlify (带重写), Vercel (带重写)
// const HOPLAYER_URL = 'https://hoplayer.com/index.html';
const SEARCH_HISTORY_KEY = 'videoSearchHistory';
const MAX_HISTORY_ITEMS = 5;

// 密码保护配置
const PASSWORD_CONFIG = {
    localStorageKey: 'passwordVerified',  // 存储验证状态的键名
    verificationTTL: 90 * 24 * 60 * 60 * 1000,  // 验证有效期（90天，约3个月）
    adminLocalStorageKey: 'adminPasswordVerified'  // 新增的管理员验证状态的键名
};

// 网站信息配置
const SITE_CONFIG = {
    name: 'LibreTV',
    url: 'https://libretv.is-an.org',
    description: '免费在线视频搜索与观看平台',
    logo: 'image/logo.png',
    version: '1.0.3'
};

// 源清单版本号：改了 API_SITES 或默认选中源时必须 +1，老用户会自动迁移
const SOURCES_VERSION = 2;
// 首次访问 / 源清单升级后的默认选中源（均为实测可搜索的精确源）
const DEFAULT_API_IDS = ['ruyi', 'jisu', 'uku', 'ikun'];

// API站点配置
// 2026-11-25 全量实测（走本站 /proxy/ 链路，关键词「甄嬛传/庆余年/沙丘」三轮验证）：
// 只保留能返回 JSON 且真正支持 wd 关键词的源；失效源原因写在下方注释里，恢复后可再启用。
const API_SITES = {
    ruyi: {
        api: 'https://cj.rycjapi.com/api.php/provide/vod',
        name: '如意资源',
    },
    jisu: {
        api: 'https://jszyapi.com/api.php/provide/vod',
        name: '极速资源',
        detail: 'https://jszyapi.com',
    },
    hhzy: {
        api: 'https://hhzyapi.com/api.php/provide/vod',
        name: '豪华资源',
    },
    subo: {
        api: 'https://subocaiji.com/api.php/provide/vod',
        name: '速播资源',
    },
    uku: {
        api: 'https://api.ukuapi88.com/api.php/provide/vod',
        name: 'U酷影视',
    },
    ikun: {
        api: 'https://ikunzyapi.com/api.php/provide/vod',
        name: 'iKun资源'
    },
    hongniu: {
        api: 'https://www.hongniuzy2.com/api.php/provide/vod',
        name: '红牛资源',
    },
    wujin: {
        api: 'https://api.wujinapi.com/api.php/provide/vod',
        name: '无尽资源'
    },
    xinlang: {
        api: 'https://api.xinlangapi.com/xinlangapi.php/provide/vod',
        name: '新浪资源',
    },
    ffzy: {
        api: 'http://ffzy5.tv/api.php/provide/vod',
        name: '非凡影视',
        detail: 'http://ffzy5.tv', 
    },
    ffzy2: {
        api: 'http://cj.ffzyapi.com/api.php/provide/vod',
        name: '非凡资源',
    },
    zy360: {
        api: 'https://360zy.com/api.php/provide/vod',
        name: '360资源',
    },
    zy360b: {
        api: 'https://360zyzz.com/api.php/provide/vod',
        name: '360资源B',
    },
    iqiyi: {
        api: 'https://iqiyizyapi.com/api.php/provide/vod',
        name: 'iqiyi资源',
    },
    dyttzy: {
        api: 'http://caiji.dyttzyapi.com/api.php/provide/vod',
        name: '电影天堂资源',
        detail: 'http://caiji.dyttzyapi.com', 
    },
    bfzy: {
        api: 'https://bfzyapi.com/api.php/provide/vod',
        name: '暴风资源',
    },
    lz: {
        api: 'http://cj.lziapi.com/api.php/provide/vod',
        name: '量子资源',
    },
    mdzy: {
        api: 'https://www.mdzyapi.com/api.php/provide/vod',
        name: '魔都资源',
    },
    baidu: {
        api: 'https://api.apibdzy.com/api.php/provide/vod',
        name: '百度云资源'
    },
    // 豆瓣海报跳转依赖这个源，上游当前 5xx，先挂着（默认不勾选）
    dbzy: {
        api: 'https://dbzy.tv/api.php/provide/vod',
        name: '豆瓣资源',
    },
    // ==== 以下为 2026-11-25 实测失效，已下线 ====
    // tyyszy:  { api: 'https://tyyszy.com/api.php/provide/vod', name: '天涯资源' },        // 返回「暂不支持搜索」
    // heimuer: { api: 'https://json.heimuer.xyz/api.php/provide/vod', name: '黑木耳' },      // 域名已换成网页，返回 HTML
    // wolong:  { api: 'https://wolongzyw.com/api.php/provide/vod', name: '卧龙资源' },       // 返回 HTML 欢迎页
    // hwba:    { api: 'https://cjhwba.com/api.php/provide/vod', name: '华为吧资源' },         // 返回 HTML
    // mozhua:  { api: 'https://mozhuazy.com/api.php/provide/vod', name: '魔爪资源' },         // 返回 HTML
    // wwzy:    { api: 'https://wwzy.tv/api.php/provide/vod', name: '旺旺短剧' },             // 返回 HTML
    // yinghua: { api: 'https://m3u8.apiyhzy.com/api.php/provide/vod', name: '樱花资源' },     // 上游 5xx
    // zuid:    { api: 'https://api.zuidapi.com/api.php/provide/vod', name: '最大资源' },     // 忽略 wd，返回全站 12.6 万条
    testSource: {
        api: 'https://www.example.com/api.php/provide/vod',
        name: '空内容测试源',
        adult: true
    },
    // 下面是一些成人内容的API源，默认隐藏，使用本项目浏览黄色内容违背项目初衷
    // 互联网上传播的色情内容将人彻底客体化、工具化，是性别解放和人类平等道路上的巨大障碍。
    // 这些黄色影片是资本主义父权制压迫的最恶毒体现，它将暴力和屈辱商品化，践踏人的尊严，对受害者造成无法弥愈的伤害，并毒害社会关系。
    // 资本为了利润，不惜将最卑劣的剥削（包括对受害者和表演者的剥削）和暴力商品化，
    // 把性别剥削塑造成“性享受”麻痹观众的意识，转移我们对现实生活中矛盾和压迫的注意力。
    // 这些影片和背后的产业已经使数百万男女“下海”，出卖自己的身体，甚至以此为生计。
    // 而作为观众无辜吗？毫无疑问，他们促成了黄色产业链的再生产。
    // 我们提供此警告，是希望您能认清这些内容的本质——它们是压迫和奴役的工具，而非娱乐。
    // ckzy: {
    //     api: 'https://www.ckzy1.com',
    //     name: 'CK资源',
    //     adult: true
    // },
    // jkun: {
    //     api: 'https://jkunzyapi.com',
    //     name: 'jkun资源',
    //     adult: true
    // },
    // bwzy: {
    //     api: 'https://api.bwzym3u8.com',
    //     name: '百万资源',
    //     adult: true
    // },
    // souav: {
    //     api: 'https://api.souavzy.vip',
    //     name: 'souav资源',
    //     adult: true
    // },
    // r155: {
    //     api: 'https://155api.com',
    //     name: '155资源',
    //     adult: true
    // },
    // lsb: {
    //     api: 'https://apilsbzy1.com',
    //     name: 'lsb资源',
    //     adult: true
    // },
    // huangcang: {
    //     api: 'https://hsckzy.vip',
    //     name: '黄色仓库',
    //     adult: true,
    //     detail: 'https://hsckzy.vip'
    // },
    // yutu: {
    //     api: 'https://yutuzy10.com',
    //     name: '玉兔资源',
    //     adult: true
    // },

    // 下面是资源失效率高的API源，不建议使用
    // subo: {
    //     api: 'https://subocaiji.com/api.php/provide/vod',
    //     name: '速播资源'
    // },
    // fczy: {
    //     api: 'https://api.fczy888.me/api.php/provide/vod',
    //     name: '蜂巢资源'
    // },
    // ukzy: {
    //     api: 'https://api.ukuapi88.com/api.php/provide/vod',
    //     name: 'U酷资源'
    // },
};

// 添加聚合搜索的配置选项
const AGGREGATED_SEARCH_CONFIG = {
    enabled: true,             // 是否启用聚合搜索
    timeout: 8000,            // 单个源超时时间（毫秒）
    maxResults: 10000,          // 最大结果数量
    parallelRequests: true,   // 是否并行请求所有源
    showSourceBadges: true    // 是否显示来源徽章
};

// 抽象API请求配置
const API_CONFIG = {
    search: {
        // 只拼接参数部分，不再包含 /api.php/provide/vod/
        path: '?ac=videolist&wd=',
        pagePath: '?ac=videolist&wd={query}&pg={page}',
        maxPages: 5, // 每个源最多抓取的页数（抓取页数取「源站 pagecount」与它的较小值）
                     // 上游重构版默认也是 5：调大会让请求量按 源数 × 页数 放大，拖慢搜索
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    },
    detail: {
        // 只拼接参数部分
        path: '?ac=videolist&ids=',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    }
};

// 优化后的正则表达式模式
const M3U8_PATTERN = /\$https?:\/\/[^"'\s]+?\.m3u8/g;

// 添加自定义播放器URL
const CUSTOM_PLAYER_URL = 'player.html'; // 使用相对路径引用本地player.html

// 增加视频播放相关配置
const PLAYER_CONFIG = {
    autoplay: true,
    allowFullscreen: true,
    width: '100%',
    height: '600',
    timeout: 15000,  // 播放器加载超时时间
    filterAds: true,  // 是否启用广告过滤
    autoPlayNext: true,  // 默认启用自动连播功能
    adFilteringEnabled: true, // 默认开启分片广告过滤
    adFilteringStorage: 'adFilteringEnabled' // 存储广告过滤设置的键名
};

// 增加错误信息本地化
const ERROR_MESSAGES = {
    NETWORK_ERROR: '网络连接错误，请检查网络设置',
    TIMEOUT_ERROR: '请求超时，服务器响应时间过长',
    API_ERROR: 'API接口返回错误，请尝试更换数据源',
    PLAYER_ERROR: '播放器加载失败，请尝试其他视频源',
    UNKNOWN_ERROR: '发生未知错误，请刷新页面重试'
};

// 添加进一步安全设置
const SECURITY_CONFIG = {
    enableXSSProtection: true,  // 是否启用XSS保护
    sanitizeUrls: true,         // 是否清理URL
    maxQueryLength: 100,        // 最大搜索长度
    // allowedApiDomains 不再需要，因为所有请求都通过内部代理
};

// 添加多个自定义API源的配置
const CUSTOM_API_CONFIG = {
    separator: ',',           // 分隔符
    maxSources: 5,            // 最大允许的自定义源数量
    testTimeout: 5000,        // 测试超时时间(毫秒)
    namePrefix: 'Custom-',    // 自定义源名称前缀
    validateUrl: true,        // 验证URL格式
    cacheResults: true,       // 缓存测试结果
    cacheExpiry: 5184000000,  // 缓存过期时间(2个月)
    adultPropName: 'isAdult' // 用于标记成人内容的属性名
};

// 隐藏内置黄色采集站API的变量
const HIDE_BUILTIN_ADULT_APIS = false;
