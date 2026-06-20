#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动翻译日志多语言工具
用法：python tools/auto_translate_log.py

功能：输入中文标题和内容，自动翻译并写入 8 个 locales/*.json
"""

import json
import os
import sys
import time

# 项目根目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES_DIR = os.path.join(BASE_DIR, 'locales')

# 8 种语言配置
LANGUAGES = {
    'zh': {'name': '中文（默认）', 'target': 'zh-CN', 'auto': False},  # 中文直接复制
    'en': {'name': 'English', 'target': 'en', 'auto': True},
    'es': {'name': 'Español', 'target': 'es', 'auto': True},
    'fr': {'name': 'Français', 'target': 'fr', 'auto': True},
    'de': {'name': 'Deutsch', 'target': 'de', 'auto': True},
    'ja': {'name': '日本語', 'target': 'ja', 'auto': True},
    'ko': {'name': '한국어', 'target': 'ko', 'auto': True},
    'ru': {'name': 'Русский', 'target': 'ru', 'auto': True}
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


def translate_text(text, target_lang, translator=None):
    """使用 Google Translate 免费 API 翻译"""
    try:
        from deep_translator import GoogleTranslator
        if translator is None:
            translator = GoogleTranslator(source='zh-CN', target=target_lang)
        result = translator.translate(text)
        return result
    except Exception as e:
        print(f'    ⚠️ 翻译失败: {e}')
        return None


def auto_translate_log():
    """主流程：自动翻译日志"""
    print('=' * 60)
    print('  🌐 自动翻译日志多语言工具')
    print('  （输入中文，自动翻译为 8 种语言）')
    print('=' * 60)
    print()

    # 1. 输入中文内容
    i18n_key = input('请输入 I18N_KEY（如 log_20250621）: ').strip()
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
    print('请输入中文内容（作为源文本自动翻译）：')
    print('-' * 60)
    zh_title = input('  中文标题: ').strip()
    zh_content = input('  中文内容: ').strip()

    if not zh_title or not zh_content:
        print('❌ 标题和内容不能为空')
        return

    # 2. 自动翻译
    print()
    print('正在自动翻译...（需要联网，可能需要几秒）')
    print('-' * 60)

    translations = {'zh': {'title': zh_title, 'content': zh_content}}

    for lang, config in LANGUAGES.items():
        if lang == 'zh':
            continue  # 中文直接复制，不需要翻译

        print(f'  🔄 翻译 {config["name"]} ({lang})...', end=' ', flush=True)
        time.sleep(0.5)  # 避免请求过快

        title = translate_text(zh_title, config['target'])
        time.sleep(0.3)
        content = translate_text(zh_content, config['target'])

        if title and content:
            translations[lang] = {'title': title, 'content': content}
            print(f"✅ '{title}'")
        else:
            print(f'❌ 翻译失败')
            translations[lang] = {'title': f'[TRANSLATE:{lang}]', 'content': f'[TRANSLATE:{lang}]'}

    # 3. 确认预览
    print()
    print('-' * 60)
    print('📋 翻译结果预览：')
    print(f'  I18N_KEY: {i18n_key}')
    for lang, config in LANGUAGES.items():
        t = translations[lang]
        status = '✅' if not t['title'].startswith('[TRANSLATE:') else '⚠️ 待补充'
        print(f'  {status} {config["name"]}: {t["title"]}')
    print('-' * 60)

    # 如果有翻译失败，提示用户手动修正
    failed = [lang for lang, t in translations.items() if t['title'].startswith('[TRANSLATE:')]
    if failed:
        print(f'\n⚠️ 以下语言翻译失败，已用占位符标记: {", ".join(failed)}')
        print('  你可以在翻译文件中手动替换这些占位符。')
        print('  占位符格式: [TRANSLATE:语言代码]')

    confirm = input('\n确认写入所有 8 个语言文件？(y/n): ').strip().lower()
    if confirm != 'y':
        print('已取消')
        return

    # 4. 写入所有文件
    print()
    print('正在写入翻译文件...')
    for lang in LANGUAGES.keys():
        data = load_locale(lang)
        if not data:
            continue

        if 'about' not in data:
            data['about'] = {}

        data['about'][i18n_key] = translations[lang]
        save_locale(lang, data)

    print()
    print('=' * 60)
    print('✅ 全部更新完成！')
    print()
    print('下一步：')
    print('  1. 复制到部署目录: cp locales/* ../Jul.github.io/locales/')
    print('  2. git add -A && git commit -m "添加日志翻译" && git push')
    print('  3. 前台按 Ctrl+F5 强制刷新查看效果')
    print('=' * 60)

    if failed:
        print()
        print('💡 提示：翻译失败的语言已用占位符标记，')
        print('   你可以在后续用手动方式补充（编辑对应 locales/*.json）。')


if __name__ == '__main__':
    try:
        auto_translate_log()
    except KeyboardInterrupt:
        print('\n\n已取消')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ 错误: {e}')
        sys.exit(1)
