# Shangban

一个 web 版本的哄自己上班软件。它用真实三花猫视频、翻页倒计时和可交互猫叫，帮你更温和地度过工作时间。

## 功能

- 真实三花小猫视频循环
- 点击小猫触发不同真实猫叫
- 双击或长按小猫触发真实呼噜声
- 上班前、上班中、下班后的翻页倒计时
- 本地读取上下班时间设置
- Netlify 静态部署配置

## 素材来源

- `Spitting Cat Chases Shadow.webm`: Wikimedia Commons, author MLinington, CC BY-SA 4.0.
- `Meow of a pleading cat.oga`: Wikimedia Commons, author Heismark, public domain.
- `Maullido de gata hembra joven.ogg`: Wikimedia Commons, author George Miquilena, CC0 1.0.
- `Purring cat.oga`: Wikimedia Commons, author Mysid, public domain.

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

Netlify 构建命令为 `npm run build`，发布目录为 `dist`。
