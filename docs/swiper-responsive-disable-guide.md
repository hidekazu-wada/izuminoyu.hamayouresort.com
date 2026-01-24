# スマホ時のSwiper無効化ガイド

スマホでは縦並びリスト、タブレット以上ではスライダーという切り替えを実装する方法をまとめます。

---

## 2つのアプローチ

| 方法 | 概要 |
|------|------|
| **方法1: Swiperオプション** | JavaScriptで画面幅を検知し、Swiperを初期化/破棄 |
| **方法2: DOM分離** | SP用とPC用のHTMLを別々に用意し、CSSで表示切り替え |

---

## 判断基準

```
まずは方法1（Swiperオプション）で検討
        ↓
SP時とPC時でレイアウトが大きく変わる？
        ↓
    はい → 方法2（DOM分離）を検討
    いいえ → 方法1で実装
```

### どちらを選ぶか

| 条件 | 推奨 |
|------|------|
| SP/PCでアイテムの構造は同じ、並び方だけ違う | 方法1 |
| SP/PCでアイテムのHTML構造自体が異なる | 方法2 |
| SP/PCで表示する要素が異なる | 方法2 |
| HTMLの重複を避けたい | 方法1 |
| CSSの複雑さを避けたい | 方法2 |

---

## 方法1: Swiperオプション（JavaScript制御）

### メリット
- HTMLが1つで済む（DRY原則）
- コンテンツの更新が1箇所で完結
- ページの読み込み容量が軽い

### デメリット
- SP時のレイアウトをCSSで調整する必要がある
- 複雑なレイアウト変更には対応しにくい

### 仕組み

1. 画面幅を検知
2. タブレット以上 → Swiperを初期化
3. スマホ → Swiperを破棄（CSSで縦並びに）

### サンプルコード

#### HTML

```html
<div class="slider">
  <div class="swiper slider__swiper">
    <div class="swiper-wrapper">
      <div class="swiper-slide">
        <div class="slider__item">アイテム1</div>
      </div>
      <div class="swiper-slide">
        <div class="slider__item">アイテム2</div>
      </div>
      <div class="swiper-slide">
        <div class="slider__item">アイテム3</div>
      </div>
      <div class="swiper-slide">
        <div class="slider__item">アイテム4</div>
      </div>
      <div class="swiper-slide">
        <div class="slider__item">アイテム5</div>
      </div>
    </div>
  </div>
  <!-- ナビゲーション -->
  <button class="slider__nav slider__nav--prev" aria-label="前へ">←</button>
  <button class="slider__nav slider__nav--next" aria-label="次へ">→</button>
</div>
```

#### JavaScript

```typescript
import Swiper from "swiper";
import { Navigation, Autoplay } from "swiper/modules";

document.addEventListener("DOMContentLoaded", () => {
  const swiperElement = document.querySelector(".slider__swiper") as HTMLElement;

  if (!swiperElement) {
    console.warn("Swiper element not found");
    return;
  }

  // ブレイクポイント
  const tabletBreakpoint = 744;

  // Swiperインスタンスを保持
  let swiper: Swiper | null = null;

  // Swiperを初期化する関数
  const initSwiper = () => {
    if (swiper) return; // 既に初期化済みの場合はスキップ

    swiper = new Swiper(swiperElement, {
      modules: [Navigation, Autoplay],
      loop: true,
      slidesPerView: "auto",
      spaceBetween: 0,
      speed: 600,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      navigation: {
        prevEl: ".slider__nav--prev",
        nextEl: ".slider__nav--next",
      },
    });
  };

  // Swiperを破棄する関数
  const destroySwiper = () => {
    if (swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }
  };

  // 画面幅に応じてSwiper有効/無効を切り替え
  const handleResize = () => {
    if (window.innerWidth >= tabletBreakpoint) {
      initSwiper();
    } else {
      destroySwiper();
    }
  };

  // 初期化
  handleResize();

  // リサイズイベントを監視
  window.addEventListener("resize", handleResize);
});
```

#### SCSS

```scss
.slider {
  // 外側ラッパー
  &__slider {
    position: relative;
    width: 100%;
    @include tablet-up {
      // 表示枚数分の幅に制限して中央配置
      max-width: calc(#{ppx(500 * 1.2)} * 3 + #{ppx(25 * 1.2)} * 2);
      margin: 0 auto;
    }
    @include desktop-up {
      max-width: calc(#{ppx(500)} * 4 + #{ppx(25)} * 3);
    }
  }

  // Swiperコンテナ
  &__swiper {
    overflow: visible;
    @include tablet-up {
      overflow: hidden;
    }

    // swiper-wrapper（スコープを限定）
    :global(.swiper-wrapper) {
      display: flex;
      // SP時：縦並び
      flex-direction: column;
      align-items: center;
      gap: spx(25);
      // タブレット以上：横並び（Swiperが制御）
      @include tablet-up {
        flex-direction: row;
        gap: 0;
      }
    }

    // swiper-slide
    :global(.swiper-slide) {
      margin-right: 0;
      @include tablet-up {
        margin-right: ppx(25 * 1.2);
      }
      @include desktop-up {
        margin-right: ppx(25);
      }
      &:last-child {
        margin-right: 0;
      }
    }
  }

  // ナビゲーション（SP時は非表示）
  &__nav {
    display: none;
    @include tablet-up {
      display: flex;
      // 以下、ナビゲーションのスタイル
    }
  }

  // アイテム
  &__item {
    width: spx(500);
    @include tablet-up {
      width: ppx(500 * 1.2);
    }
    @include desktop-up {
      width: ppx(500);
    }
  }
}
```

---

## 方法2: DOM分離（HTML2つ）

### メリット
- SP/PCで完全に異なるレイアウトに対応可能
- CSSがシンプルになる
- 各デバイス専用の最適化が可能

### デメリット
- HTMLが重複する
- コンテンツ更新時に2箇所の修正が必要
- ページの読み込み容量が増える

### 仕組み

1. SP用HTML（リスト形式）とPC用HTML（Swiper形式）を両方記述
2. CSSで表示/非表示を切り替え

### サンプルコード

#### HTML

```html
<!-- SP用（リスト表示） -->
<div class="slider-sp">
  <div class="slider-sp__item">アイテム1</div>
  <div class="slider-sp__item">アイテム2</div>
  <div class="slider-sp__item">アイテム3</div>
  <div class="slider-sp__item">アイテム4</div>
  <div class="slider-sp__item">アイテム5</div>
</div>

<!-- PC用（Swiper） -->
<div class="slider-pc">
  <div class="swiper slider-pc__swiper">
    <div class="swiper-wrapper">
      <div class="swiper-slide">
        <div class="slider-pc__item">アイテム1</div>
      </div>
      <div class="swiper-slide">
        <div class="slider-pc__item">アイテム2</div>
      </div>
      <div class="swiper-slide">
        <div class="slider-pc__item">アイテム3</div>
      </div>
      <div class="swiper-slide">
        <div class="slider-pc__item">アイテム4</div>
      </div>
      <div class="swiper-slide">
        <div class="slider-pc__item">アイテム5</div>
      </div>
    </div>
  </div>
  <button class="slider-pc__nav slider-pc__nav--prev">←</button>
  <button class="slider-pc__nav slider-pc__nav--next">→</button>
</div>
```

#### SCSS

```scss
// SP用
.slider-sp {
  display: flex;
  flex-direction: column;
  gap: spx(25);
  @include tablet-up {
    display: none; // タブレット以上で非表示
  }
}

// PC用
.slider-pc {
  display: none; // SP時は非表示
  @include tablet-up {
    display: block;
  }
}
```

#### JavaScript

```typescript
import Swiper from "swiper";
import { Navigation, Autoplay } from "swiper/modules";

// PC用Swiperのみ初期化（SP用はSwiperなし）
document.addEventListener("DOMContentLoaded", () => {
  const swiperElement = document.querySelector(".slider-pc__swiper");
  if (!swiperElement) return;

  new Swiper(swiperElement, {
    modules: [Navigation, Autoplay],
    loop: true,
    slidesPerView: "auto",
    spaceBetween: 0,
    speed: 600,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    navigation: {
      prevEl: ".slider-pc__nav--prev",
      nextEl: ".slider-pc__nav--next",
    },
  });
});
```

---

## 比較まとめ

| 項目 | 方法1: Swiperオプション | 方法2: DOM分離 |
|------|------------------------|----------------|
| HTML | 1つ | 2つ（重複） |
| CSS複雑さ | やや複雑 | シンプル |
| JS複雑さ | やや複雑（初期化/破棄） | シンプル |
| レイアウト自由度 | 中 | 高 |
| 保守性 | 高（1箇所更新） | 低（2箇所更新） |
| 読み込み容量 | 軽い | やや重い |
| 推奨ケース | 並び方の変更のみ | 構造が大きく変わる |

---

## 選択フローチャート

```
Q1: SP/PCでアイテムのHTML構造は同じ？
    ├─ はい → 方法1（Swiperオプション）を推奨
    └─ いいえ → Q2へ

Q2: SP/PCで表示する要素の数や内容は同じ？
    ├─ はい → 方法1でも対応可能か検討
    └─ いいえ → 方法2（DOM分離）を推奨
```

---

## 参考

- 関連ドキュメント: [swiper-implementation-guide.md](./swiper-implementation-guide.md)
- Swiper公式: https://swiperjs.com/
