// ==UserScript==
// @name               [Gemini] use system theme [20260112] v1.0.0
// @name:zh-CN         [Gemini] 使用系统主题 [20260112] v1.0.0
// @namespace          http://tampermonkey.net/
// @version            [20260112] v1.0.0
// @description        Keep Gemini on your system theme (clear saved theme when it disagrees -> prevent black screens in light mode).
// @description:zh-CN  让 Gemini 跟随系统主题（发现本地存储与系统不一致时将其清除 -> 避免普通模式下出现黑屏）
// @author             Assistant
// @match              https://gemini.google.com/*
// @run-at             document-start
// @grant              none
// ==/UserScript==

(function() {
    'use strict';

    // 防止在 iframe 中运行
    if (window.self !== window.top) {
        return;
    }

    // ==================== 配置常量 ====================
    const THEME_KEY = 'Bard-Color-Theme';
    const DEBUG = false; // 设为 true 可开启调试日志

    // ==================== 工具函数 ====================

    /**
     * 调试日志输出
     * @param  {...any} args - 日志参数
     */
    function log(...args) {
        if (DEBUG) {
            console.log('[Gemini主题同步]', ...args);
        }
    }

    /**
     * 获取系统主题是否为深色模式
     * 使用 CSS Media Query API 检测系统级别的主题偏好
     * @returns {boolean} true 表示系统为深色模式，false 表示浅色模式
     */
    function getSystemThemeIsDark() {
        try {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch (e) {
            // 如果 matchMedia 不可用，默认返回 false（浅色模式）
            log('matchMedia API 不可用，默认使用浅色模式');
            return false;
        }
    }

    /**
     * 解析存储的主题值，判断是否为深色模式
     * Gemini 的主题值通常包含 "Light" 或 "Dark" 字符串
     *
     * @param {string} value - localStorage 中存储的主题值
     * @returns {boolean|null}
     *   - true: 深色模式
     *   - false: 浅色模式
     *   - null: 无法判断（值为空或不包含可识别的主题标识）
     */
    function parseStoredTheme(value) {
        // 空值检查
        if (!value || typeof value !== 'string') {
            return null;
        }

        // 转换为小写进行不区分大小写的匹配
        const lowerValue = value.toLowerCase();

        // 检查是否包含深色模式标识
        if (lowerValue.includes('dark')) {
            return true;
        }

        // 检查是否包含浅色模式标识
        if (lowerValue.includes('light')) {
            return false;
        }

        // 无法识别的值
        return null;
    }

    /**
     * 主函数：同步主题与系统设置
     *
     * 逻辑流程：
     * 1. 检查 localStorage 中是否存在主题设置
     * 2. 如果存在，获取系统当前主题偏好
     * 3. 对比两者是否一致
     * 4. 不一致时删除存储的主题值，让页面使用系统默认主题
     */
    function syncThemeWithSystem() {
        try {
            // ========== 步骤1: 读取存储的主题 ==========
            const storedTheme = localStorage.getItem(THEME_KEY);

            // 如果不存在存储的主题，说明页面会使用默认行为，无需干预
            if (!storedTheme) {
                log('未检测到存储的主题，跳过处理');
                return;
            }

            log('检测到存储的主题:', storedTheme);

            // ========== 步骤2: 获取系统主题 ==========
            const systemIsDark = getSystemThemeIsDark();
            log('系统主题:', systemIsDark ? '深色模式' : '浅色模式');

            // ========== 步骤3: 解析存储的主题 ==========
            const storedIsDark = parseStoredTheme(storedTheme);

            // 如果无法解析存储的主题值，保守处理，不做任何操作
            if (storedIsDark === null) {
                log('无法解析存储的主题值，跳过处理');
                return;
            }

            log('存储的主题:', storedIsDark ? '深色模式' : '浅色模式');

            // ========== 步骤4: 对比并处理 ==========
            if (storedIsDark !== systemIsDark) {
                // 主题不一致，删除存储的值
                localStorage.removeItem(THEME_KEY);
                log('✓ 主题不一致，已删除存储的主题值，页面将使用系统主题');
            } else {
                // 主题一致，无需处理
                log('✓ 主题一致，无需处理');
            }

        } catch (error) {
            // 捕获所有异常，确保脚本不会因错误而影响页面正常加载
            console.error('[Gemini主题同步] 执行出错:', error);
        }
    }

    // ==================== 立即执行 ====================
    // 在 document-start 阶段执行，确保在页面渲染前完成主题同步
    syncThemeWithSystem();

})();
