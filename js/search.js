// 本轮搜索中失败的数据源：用于在结果页提示「源挂了」而不是显示「没有结果」
let SEARCH_FAILURES = [];

function resetSearchFailures() {
    SEARCH_FAILURES = [];
}

function markSourceFailed(apiId, apiName, reason) {
    bumpSourceHealth(apiId, false);
    if (SEARCH_FAILURES.some(f => f.code === apiId)) return;
    SEARCH_FAILURES.push({ code: apiId, name: apiName || apiId, reason: reason || '请求失败' });
}

// 源健康度：记住连续失败次数，帮用户判断该不该继续勾着这个源
const SOURCE_HEALTH_KEY = 'sourceHealth';

function loadSourceHealth() {
    try {
        const raw = JSON.parse(localStorage.getItem(SOURCE_HEALTH_KEY) || '{}');
        return (raw && typeof raw === 'object') ? raw : {};
    } catch (e) {
        return {};
    }
}

function bumpSourceHealth(apiId, ok) {
    try {
        if (!apiId) return;
        const all = loadSourceHealth();
        const rec = all[apiId] || { fails: 0 };
        rec.fails = ok ? 0 : (rec.fails || 0) + 1;
        rec.updatedAt = Date.now();
        all[apiId] = rec;
        localStorage.setItem(SOURCE_HEALTH_KEY, JSON.stringify(all));
    } catch (e) {
        // localStorage 被禁用时静默降级，不影响搜索
    }
}

function getSourceFailStreak(apiId) {
    const rec = loadSourceHealth()[apiId];
    return (rec && rec.fails) ? rec.fails : 0;
}

async function searchByAPIAndKeyWord(apiId, query) {
    let apiName = apiId;

    try {
        let apiUrl, apiBaseUrl;

        // 处理自定义API
        if (apiId.startsWith('custom_')) {
            const customIndex = apiId.replace('custom_', '');
            const customApi = getCustomApiInfo(customIndex);
            if (!customApi) {
                markSourceFailed(apiId, apiId, '自定义源已失效');
                return [];
            }

            apiBaseUrl = customApi.url;
            apiUrl = apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);
            apiName = customApi.name;
        } else {
            // 内置API
            if (!API_SITES[apiId]) {
                markSourceFailed(apiId, apiId, '该源已下线');
                return [];
            }
            apiBaseUrl = API_SITES[apiId].api;
            apiUrl = apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);
            apiName = API_SITES[apiId].name;
        }

        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        let response;
        try {
            response = await fetch(PROXY_URL + encodeURIComponent(apiUrl), {
                headers: API_CONFIG.search.headers,
                signal: controller.signal
            });
        } catch (error) {
            markSourceFailed(apiId, apiName, error.name === 'AbortError' ? '超时' : '网络错误');
            return [];
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            markSourceFailed(apiId, apiName, `HTTP ${response.status}`);
            return [];
        }

        // 有些源已停止提供采集接口，会返回 HTML 欢迎页，这里必须显式识别
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            markSourceFailed(apiId, apiName, '返回的不是 JSON');
            return [];
        }

        if (!data || !Array.isArray(data.list)) {
            markSourceFailed(apiId, apiName, '返回格式异常');
            return [];
        }

        // 能正常返回合法结构就算这个源活着（即使是空结果）
        bumpSourceHealth(apiId, true);

        if (data.list.length === 0) {
            // 搜索成功但无结果，不算源故障
            return [];
        }

        // 处理第一页结果，保留上游原始顺序（作为相关性排序的次级依据）
        const results = data.list.map((item, index) => ({
            ...item,
            source_name: apiName,
            source_code: apiId,
            _order: index,
            api_url: apiId.startsWith('custom_') ? getCustomApiInfo(apiId.replace('custom_', ''))?.url : undefined
        }));

        // 获取总页数
        const pageCount = data.pagecount || 1;
        // 源站 pagecount 异常（无视关键词返回全站数据）时不再翻页
        const safePageCount = pageCount > 200 ? 1 : pageCount;
        // 确定需要获取的额外页数 (最多获取maxPages页)
        const pagesToFetch = Math.min(safePageCount - 1, API_CONFIG.search.maxPages - 1);

        // 如果有额外页数，获取更多页的结果
        if (pagesToFetch > 0) {
            const additionalPagePromises = [];

            for (let page = 2; page <= pagesToFetch + 1; page++) {
                // 构建分页URL
                const pageUrl = apiBaseUrl + API_CONFIG.search.pagePath
                    .replace('{query}', encodeURIComponent(query))
                    .replace('{page}', page);

                // 创建获取额外页的Promise
                const pagePromise = (async () => {
                    try {
                        const pageController = new AbortController();
                        const pageTimeoutId = setTimeout(() => pageController.abort(), 8000);

                        const pageResponse = await fetch(PROXY_URL + encodeURIComponent(pageUrl), {
                            headers: API_CONFIG.search.headers,
                            signal: pageController.signal
                        });

                        clearTimeout(pageTimeoutId);

                        if (!pageResponse.ok) return [];

                        const pageData = JSON.parse(await pageResponse.text());

                        if (!pageData || !Array.isArray(pageData.list)) return [];

                        // 处理当前页结果
                        return pageData.list.map((item, index) => ({
                            ...item,
                            source_name: apiName,
                            source_code: apiId,
                            _order: results.length + index,
                            api_url: apiId.startsWith('custom_') ? getCustomApiInfo(apiId.replace('custom_', ''))?.url : undefined
                        }));
                    } catch (error) {
                        console.warn(`API ${apiId} 第${page}页搜索失败:`, error);
                        return [];
                    }
                })();

                additionalPagePromises.push(pagePromise);
            }

            // 等待所有额外页的结果
            const additionalResults = await Promise.all(additionalPagePromises);

            // 合并所有页的结果
            additionalResults.forEach(pageResults => {
                if (pageResults.length > 0) {
                    results.push(...pageResults);
                }
            });
        }

        return results;
    } catch (error) {
        console.warn(`API ${apiId} 搜索失败:`, error);
        markSourceFailed(apiId, apiName, '请求异常');
        return [];
    }
}
