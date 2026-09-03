# HeartQuest

## 概要

**HeartQuest** は、ユーザーが日々行ったリフレッシュ・回復行動を記録し、その効果を評価・分析するWebアプリケーションです。

ユーザー自身による10段階評価とAIによる分析を組み合わせることで、

* 自分に効果のある回復方法を知る
* 過去に試したことのない回復方法を発見する
* 回復傾向をグラフで振り返る

ことを目的とします。

ハッカソンでの開発を想定し、複雑なインフラ構成を避けながら、**実際にインターネット上から利用できるプロダクトとして動作すること**を優先しています。

---

# システム構成

HeartQuestでは、以下の構成を採用します。

```text
┌──────────────────────────┐
│ プレイヤー                │
│ スマホ / PC のブラウザ     │
└────────────┬─────────────┘
             │
             │ HTTPS
             ▼
┌──────────────────────────┐
│ Tailscale Funnel          │
│ https://xxxxx.ts.net      │
└────────────┬─────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 自宅 Windows PC                     │
│                                     │
│ ┌─────────────────┐                 │
│ │ React + Vite    │                 │
│ │ Frontend        │                 │
│ └────────┬────────┘                 │
│          │ REST API                 │
│          ▼                          │
│ ┌─────────────────┐                 │
│ │ FastAPI         │                 │
│ │ Backend         │                 │
│ └───────┬─────────┘                 │
│         │                           │
│    ┌────┴────┐                      │
│    ▼         ▼                      │
│ SQLite   Firebase Admin SDK         │
│                                     │
└──────────────┬──────────────────────┘
               │
               │ HTTPS
               ▼
         ┌─────────────┐
         │ AI API      │
         └─────────────┘
```

---

# 技術スタック

## フロントエンド

| 技術                      | 用途                          |
| ----------------------- | --------------------------- |
| React                   | WebアプリケーションのUI              |
| TypeScript              | フロントエンド開発言語                 |
| Vite                    | Reactの開発・ビルド環境              |
| CSS / Tailwind CSS      | UIデザイン                      |
| Chart.js                | 棒グラフ・円グラフ等の表示               |
| Firebase JavaScript SDK | Firebase Authenticationとの通信 |

---

## バックエンド

| 技術                 | 用途                   |
| ------------------ | -------------------- |
| FastAPI            | REST API             |
| Python             | バックエンド処理             |
| Firebase Admin SDK | Firebase ID Tokenの検証 |
| SQLite             | アプリケーションデータ保存        |
| AI API             | 回復方法の提案・分析           |

---

## インフラ

| 技術               | 用途                  |
| ---------------- | ------------------- |
| Windows PC       | Webサーバ・DBサーバ        |
| Tailscale        | Windows PCのネットワーク接続 |
| Tailscale Funnel | インターネットへのHTTPS公開    |
| Git              | バージョン管理             |
| GitHub           | 2人での共同開発            |

---

# 技術選定の役割

それぞれの技術は、以下の役割を担当します。

```text
Firebase Authentication
        ↓
「誰がアクセスしているか」
        ↓
認証


Tailscale Funnel
        ↓
「インターネットからWindows PCへどう到達するか」
        ↓
外部公開


FastAPI
        ↓
「アプリケーションで何をするか」
        ↓
ビジネスロジック


SQLite
        ↓
「何を保存するか」
        ↓
データ管理


AI API
        ↓
「どんな回復方法を提案・分析するか」
        ↓
AI処理


React
        ↓
「ユーザーにどう見せるか」
        ↓
UI
```

---

# 認証方式

ログイン機能には **Firebase Authentication** を使用します。

Windows PC側ではパスワードを管理しません。

Firebaseで認証されたユーザーに発行される **Firebase ID Token** をFastAPIへ送信し、FastAPI側でFirebase Admin SDKを使用して検証します。

---

## ログインの流れ

```text
ユーザー
   ↓
React
   ↓
Firebase Authentication
   ↓
ログイン成功
   ↓
Firebase ID Token取得
   ↓
React
```

---

## APIアクセス時

```text
React
   │
   │ Authorization:
   │ Bearer <Firebase ID Token>
   │
   ▼
FastAPI
   ↓
Firebase Admin SDK
   ↓
ID Token検証
   ↓
Firebase UID取得
   ↓
SQLiteからユーザー情報取得
```

FastAPIへのAPIアクセスでは、基本的に以下のHTTPヘッダーを送信します。

```http
Authorization: Bearer <Firebase ID Token>
```

---

# ユーザー管理

FirebaseのユーザーIDである `uid` をアプリケーション側のユーザーと紐付けます。

例：

```text
users
--------------------------------
id
firebase_uid
display_name
created_at
```

`firebase_uid` を利用することで、FastAPI側でパスワードを管理する必要がありません。

---

# 外部公開

Windows PCは自宅に設置します。

他のプレイヤーが好きな場所からアクセスできるようにするため、**Tailscale Funnel** を使用します。

```text
Internet
   ↓
HTTPS
   ↓
https://xxxxx.ts.net
   ↓
Tailscale Funnel
   ↓
Windows PC
   ↓
React / FastAPI
```

これにより、

* ルーターのポート開放
* 固定グローバルIP
* DDNS

などを準備せずにWindows PC上のWebアプリを公開できます。

Tailscale Funnelによって公開されたURLはインターネットからアクセス可能になるため、API側では必ずFirebase Authenticationによる認証を行います。

---

# 機能一覧

HeartQuestでは、以下の機能を実装します。

1. ログイン
2. 回復方法の記録
3. AIによる回復方法提案
4. ブックマーク
5. 10段階評価
6. AIによる回復効果分析
7. 回復履歴
8. リラックス効果ランキング
9. 円グラフによる分析
10. 月ごとの回復傾向表示

---

# 1. ログイン機能

## 使用技術

* React
* Firebase Authentication
* Firebase JavaScript SDK
* FastAPI
* Firebase Admin SDK

## 処理

```text
ログイン画面
   ↓
Firebase Authentication
   ↓
ログイン成功
   ↓
Firebase ID Token
   ↓
React
   ↓
FastAPI
   ↓
Firebase Admin SDK
   ↓
認証完了
```

---

# 2. 回復方法の記録

ユーザーが実際に行ったリフレッシュ方法を登録します。

## 使用技術

* React
* FastAPI
* SQLite

## 処理

```text
回復する
   ↓
回復方法を入力
   ↓
React
   ↓
POST /recoveries
   ↓
FastAPI
   ↓
SQLite
```

送信例：

```json
{
  "activity": "散歩",
  "memo": "近所を20分歩いた"
}
```

---

# 3. AIによる回復方法提案

ユーザーが何をすればよいかわからない場合、AIに回復方法を提案してもらいます。

## 使用技術

* React
* FastAPI
* SQLite
* AI API

## 提案方針

AIは以下の2種類を提案します。

### 定番の回復方法

例：

* 散歩
* 音楽を聴く
* 入浴
* ストレッチ

### 新規性のある回復方法

ユーザーが過去に実施していない行動を、履歴をもとにAIが提案します。

例えばユーザーが、

```text
散歩
音楽
昼寝
ゲーム
```

をすでに実施している場合、それ以外の回復方法を優先して提案します。

## 処理

```text
AIに提案してもらう
        ↓
React
        ↓
FastAPI
        ↓
SQLite
        ↓
過去の回復履歴取得
        ↓
AI API
        ↓
定番案 + 新規案
        ↓
FastAPI
        ↓
React
```

---

# 4. ブックマーク機能

AIが提案した回復方法や、ユーザー自身が気になった回復方法を保存します。

## 使用技術

* React
* FastAPI
* SQLite

## 処理

```text
回復方法
   ↓
☆ ブックマーク
   ↓
React
   ↓
POST /bookmarks
   ↓
FastAPI
   ↓
SQLite
```

データ例：

```text
bookmarks
--------------------------------
id
user_id
title
description
created_at
```

ユーザー自身が新しい回復方法を登録することも可能にします。

---

# 5. 10段階評価

回復行動を実施した後、ユーザー自身が回復効果を10段階で評価します。

```text
回復できましたか？

1  2  3  4  5  6  7  8  9  10

低い                       高い
```

## 使用技術

* React
* FastAPI
* SQLite

## 処理

```text
10段階評価
   ↓
React
   ↓
PUT /recoveries/{id}/rating
   ↓
FastAPI
   ↓
SQLite
```

---

# 6. AIによる回復効果分析

ユーザー自身の評価とは別に、AIにも回復効果を分析させます。

## 使用する情報

AIには以下の情報を渡します。

```text
回復前の状態

+

実施した回復方法

+

回復後の感想

+

本人の10段階評価
```

AIは、

* 回復スコア
* コメント
* 回復傾向

などを返します。

## 処理

```text
回復データ
    ↓
FastAPI
    ↓
AI API
    ↓
AI分析
    ↓
FastAPI
    ↓
SQLite
```

将来的に気分バーやキャラクター機能を実装する場合、このAIスコアを利用できます。

---

# 7. 回復履歴

ユーザーが過去に行った回復行動を確認できます。

## 使用技術

* React
* FastAPI
* SQLite

## API

```http
GET /recoveries
```

表示イメージ：

```text
2026/09/03

散歩
評価: 8 / 10

AI評価: 7.8


2026/09/02

音楽
評価: 6 / 10

AI評価: 6.4
```

---

# 8. リラックス効果ランキング

過去の評価を集計し、ユーザーにとって効果が高かった回復方法をランキング化します。

## 使用技術

* SQLite
* FastAPI
* React
* Chart.js

例えば、

```text
散歩
8 / 9 / 7 / 8

平均
8.0
```

のように平均値を計算します。

表示例：

```text
回復効果ランキング

散歩      ██████████  8.0
入浴      █████████   7.6
音楽      ████████    7.1
ゲーム    ██████      5.4
```

---

# 9. 円グラフ

ユーザーの回復方法の傾向を円グラフで表示します。

## 使用技術

* React
* Chart.js
* FastAPI
* SQLite

例：

```text
回復効果の高かった方法

散歩    35%
音楽    25%
入浴    20%
その他  20%
```

単純な実行回数ではなく、**高評価だった回復方法の割合**などを表示することで、ユーザー自身の回復傾向を把握しやすくします。

---

# 10. 月ごとの分析

月ごとの回復傾向をグラフで表示します。

## 使用技術

* React
* Chart.js
* FastAPI
* SQLite

API例：

```http
GET /analytics/monthly
```

表示例：

```text
平均回復スコア

10 |
 9 |
 8 |          █
 7 |    █     █
 6 |    █  █  █
 5 | █  █  █  █
   +-------------
     5月 6月 7月 8月
```

これにより、

* 最近回復できているか
* どの月に調子がよかったか
* 回復方法がどのように変化したか

を確認できます。

---

# API構成

FastAPIでは以下のAPIを実装する予定です。

```text
/auth
│
└── GET /auth/me


/recoveries
│
├── GET  /recoveries
├── POST /recoveries
└── PUT  /recoveries/{id}/rating


/bookmarks
│
├── GET    /bookmarks
├── POST   /bookmarks
└── DELETE /bookmarks/{id}


/ai
│
├── POST /ai/recommend
└── POST /ai/analyze


/analytics
│
├── GET /analytics/ranking
└── GET /analytics/monthly
```

---

# データベース構成案

## users

```text
users
--------------------------------
id
firebase_uid
display_name
created_at
```

---

## recoveries

```text
recoveries
--------------------------------
id
user_id
activity
memo
rating
ai_score
ai_comment
created_at
```

---

## bookmarks

```text
bookmarks
--------------------------------
id
user_id
title
description
created_at
```

---

# ディレクトリ構成

```text
heartquest/
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   │
│   ├── main.py
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── recoveries.py
│   │   ├── bookmarks.py
│   │   ├── ai.py
│   │   └── analytics.py
│   │
│   ├── services/
│   │   ├── firebase.py
│   │   └── ai.py
│   │
│   └── database/
│       ├── database.py
│       └── heartquest.db
│
├── .env
├── .gitignore
└── README.md
```

---

# Windows PC内での通信

```text
React
   │
   │ HTTP / REST API
   ▼
FastAPI
   │
   ├───────────────┐
   │               │
   ▼               ▼
SQLite       Firebase Admin SDK
   │
   │
   └───────────────┐
                   │
                   ▼
                AI API
```

---

# アプリ全体の通信フロー

## 1. アクセス

```text
プレイヤー
   ↓
Internet
   ↓
Tailscale Funnel
   ↓
Windows PC
   ↓
React
```

---

## 2. ログイン

```text
React
   ↓
Firebase Authentication
   ↓
Firebase ID Token
   ↓
React
```

---

## 3. APIアクセス

```text
React
   │
   │ Firebase ID Token
   ▼
Tailscale Funnel
   ↓
FastAPI
   ↓
Firebase Admin SDK
   ↓
ユーザー認証
```

---

## 4. データ保存

```text
React
   ↓
FastAPI
   ↓
SQLite
```

---

## 5. AI処理

```text
React
   ↓
FastAPI
   ↓
SQLiteから履歴取得
   ↓
AI API
   ↓
AI結果
   ↓
FastAPI
   ↓
SQLite
   ↓
React
```

---

## 6. 分析

```text
SQLite
   ↓
FastAPI
   ↓
集計処理
   ↓
React
   ↓
Chart.js
   ↓
グラフ表示
```

---

# システム全体図

```text
                           ┌──────────────────┐
                           │ Firebase         │
                           │ Authentication   │
                           └────────▲─────────┘
                                    │
                              ログイン / Token
                                    │
                                    │
┌──────────────────┐        ┌───────┴────────┐
│ スマホ / PC       │───────▶│ React          │
│ Browser          │        │ TypeScript     │
└──────────────────┘        └───────┬────────┘
                                    │
                                    │ REST API
                                    │
                          Tailscale Funnel
                                    │
                                    ▼
                           ┌────────────────┐
                           │ FastAPI        │
                           │ Python         │
                           └───────┬────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
                 ▼                 ▼                 ▼
           ┌──────────┐    ┌──────────────┐    ┌──────────┐
           │ SQLite   │    │ Firebase     │    │ AI API   │
           │          │    │ Admin SDK    │    │          │
           └──────────┘    └──────────────┘    └──────────┘
```

---

# 優先して実装する機能

ハッカソンでは、以下を優先します。

## 優先度：高

* Firebaseログイン
* 回復方法登録
* 10段階評価
* AI回復方法提案
* 回復履歴
* SQLite保存
* Tailscale Funnelによる外部公開

これらが動けば、HeartQuestの基本的な体験をデモできます。

---

## 優先度：中

* ブックマーク
* AI回復効果分析
* 回復方法ランキング
* 月ごとのグラフ
* 円グラフ

---

## 時間に余裕があれば

* ゆるキャラ
* 気分バー
* キャラクターアニメーション
* AIスコアとキャラクター状態の連動

これらはプロダクトの魅力を高めますが、基本機能の完成を優先します。

---

# MVP

ハッカソンで最低限完成させるMVPは以下とします。

```text
ログイン
   ↓
回復方法を選ぶ / AIに提案してもらう
   ↓
回復行動を実施
   ↓
10段階評価
   ↓
AI分析
   ↓
履歴に保存
   ↓
過去の回復効果を確認
```

この一連の流れを最優先で完成させます。

---

# 最終技術スタック

```text
Frontend
├── React
├── TypeScript
├── Vite
├── CSS / Tailwind CSS
└── Chart.js


Authentication
├── Firebase Authentication
└── Firebase Admin SDK


Backend
├── Python
└── FastAPI


Database
└── SQLite


AI
└── AI API


Server
└── Windows PC 8GB


Network
├── Tailscale
└── Tailscale Funnel


Development
├── Git
└── GitHub
```

---

# 開発方針

HeartQuestでは、ハッカソンという限られた開発時間を考慮し、

**「高度な技術を使うこと」ではなく「プロダクトとして最後まで動くこと」**

を最優先とします。

そのため、

* 認証はFirebaseに任せる
* ネットワーク公開はTailscale Funnelに任せる
* DBはSQLiteにする
* バックエンドはFastAPIにする
* フロントエンドはReactにする
* AI部分のみ外部AI APIを利用する

という構成にします。

インフラや認証を自作せず、HeartQuestの中心価値である

**「自分に合った回復方法を見つけ、試し、その結果からさらに自分に合う方法を発見する」**

というユーザー体験の実装に開発時間を集中させます。
