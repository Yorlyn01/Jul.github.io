# 新日志多语言翻译模板

## 使用方式

1. 在后台填写 **I18N_KEY**（如 `log_20250621`）
2. 将下方模板中的 `log_20250621` 替换为你的 I18N_KEY
3. 将对应内容添加到每个 `locales/*.json` 文件的 `about` 对象下
4. 推送到 GitHub Pages

---

## 中文 `locales/zh.json`

```json
"log_20250621": {
  "title": "你的日志标题",
  "content": "你的日志内容"
}
```

## 英文 `locales/en.json`

```json
"log_20250621": {
  "title": "Your Log Title",
  "content": "Your log content here."
}
```

## 西班牙文 `locales/es.json`

```json
"log_20250621": {
  "title": "Título del Diario",
  "content": "Contenido del diario aquí."
}
```

## 法文 `locales/fr.json`

```json
"log_20250621": {
  "title": "Titre du Journal",
  "content": "Contenu du journal ici."
}
```

## 德文 `locales/de.json`

```json
"log_20250621": {
  "title": "Titel des Tagebuchs",
  "content": "Inhalt des Tagebuchs hier."
}
```

## 日文 `locales/ja.json`

```json
"log_20250621": {
  "title": "日記のタイトル",
  "content": "日記の内容をここに書きます。"
}
```

## 韩文 `locales/ko.json`

```json
"log_20250621": {
  "title": "일기 제목",
  "content": "일기 내용을 여기에 작성합니다."
}
```

## 俄文 `locales/ru.json`

```json
"log_20250621": {
  "title": "Заголовок дневника",
  "content": "Содержание дневника здесь."
}
```

---

## 一键添加（推荐）

在终端运行：

```bash
python tools/add_log_translation.py
```

按提示输入各语言版本，自动更新所有 8 个文件。

---

## 注意事项

- I18N_KEY 必须使用 **字母、数字、下划线**，不要用中文
- 翻译文件的 `about` 对象下必须添加 `title` 和 `content` 两个字段
- 如果某种语言没有翻译，前台会 fallback 到数据库中的中文内容
- 更新翻译文件后，前台需要 **Ctrl+F5 强制刷新** 才能生效（GitHub Pages CDN 有缓存）
