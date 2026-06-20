#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量添加日志多语言翻译工具
用法：python tools/add_log_translation.py

功能：为后台新日志一键添加 8 种语言翻译到 locales/*.json
"""

import json
import os
import sys

# 项目根目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES_DIR = os.path.join(BASE_DIR, 'locales')

# 8 种语言及默认语言名称
LANGUAGES = {
    'zh': '中文（默认）',
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'ja': '日本語',
    'ko': '한국어',
    'ru': 'Русский'
}


def load_locale(lang):
    """加载翻译文件"""
    path = os.path.join(LOCALES_DIR, f'{lang}.json')
    if not os.path.exists(path):
        print(f'❌ 文件不存在: {path}')
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_locale(lang, data):
    """保存翻译文件"""
    path = os.path.join(LOCALES_DIR, f'{lang}.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  ✅ 已更新: {lang}.json')


def add_log_translation():
    """交互式添加日志翻译"""
    print('=' * 50)
    print('  批量添加日志多语言翻译工具')
    print('=' * 50)
    print()
    print('提示：I18N_KEY 建议使用 log_日期 格式，如 log_20250621')
    print()

    # 获取 I18N_KEY
    i18n_key = input('请输入 I18N_KEY: ').strip()
    if not i18n_key:
        print('❌ I18N_KEY 不能为空')
        return

    # 检查是否已存在
    test_data = load_locale('zh')
    if test_data and 'about' in test_data and i18n_key in test_data.get('about', {}):
        print(f'⚠️ 警告: {i18n_key} 已存在于中文翻译中，将覆盖！')
        confirm = input('是否继续？(y/n): ').strip().lower()
        if confirm != 'y':
            print('已取消')
            return

    print()
    print('请输入各语言版本（中文为默认显示，其他语言可留空使用中文占位）')
    print('-' * 50)

    translations = {}
    for lang, name in LANGUAGES.items():
        print(f'\n【{name} ({lang})】')
        title = input(f'  标题 (Title): ').strip()
        content = input(f'  内容 (Content): ').strip()

        # 如果留空，使用中文版本作为占位
        if not title:
            title = f'[{name}]'
        if not content:
            content = f'[{name}]'

        translations[lang] = {
            'title': title,
            'content': content
        }

    # 确认
    print()
    print('-' * 50)
    print('预览：')
    print(f'  I18N_KEY: {i18n_key}')
    for lang, name in LANGUAGES.items():
        t = translations[lang]
        print(f'  {name}: {t["title"]}')
    print('-' * 50)

    confirm = input('\n确认添加到所有 8 个语言文件？(y/n): ').strip().lower()
    if confirm != 'y':
        print('已取消')
        return

    # 更新所有语言文件
    print()
    print('正在更新翻译文件...')
    for lang in LANGUAGES.keys():
        data = load_locale(lang)
        if not data:
            continue

        if 'about' not in data:
            data['about'] = {}

        data['about'][i18n_key] = translations[lang]
        save_locale(lang, data)

    print()
    print('=' * 50)
    print('✅ 全部更新完成！')
    print()
    print('下一步：')
    print('  1. 复制到部署目录: cp locales/* ../Jul.github.io/locales/')
    print('  2. git add + commit + push')
    print('  3. 前台按 Ctrl+F5 强制刷新查看效果')
    print('=' * 50)


if __name__ == '__main__':
    try:
        add_log_translation()
    except KeyboardInterrupt:
        print('\n\n已取消')
        sys.exit(0)
