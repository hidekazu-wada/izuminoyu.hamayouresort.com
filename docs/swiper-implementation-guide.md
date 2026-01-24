# Swiper実装ガイド（vw単位対応版）

このガイドは、vw単位（`spx()`, `ppx()`）を使用したプロジェクトでSwiperを実装する際の手順をまとめたものです。

---

## 基本方針

- **Swiperの外側で幅を制限**し、中のアイテム幅はCSSで自由に指定
- `slidesPerView: 'auto'`と`spaceBetween: 0`でCSSに制御を委ねる
- `:global()`はスコープを限定して他のSwiperに影響を与えない

---

## 1. HTML構造

```html
<div class="〇〇__slider">           <!-- 外側ラッパー：max-width設定用 -->
  <div class="swiper 〇〇__swiper">  <!-- Swiperコンテナ：overflow: hidden -->
    <div class="swiper-wrapper">
      <div class="swiper-slide">
        <div class="〇〇__item">...</div>  <!-- アイテム：幅を指定済み -->
      </div>
      <!-- 繰り返し -->
    </div>
  </div>
  <!-- ナビゲーション（必要に応じて） -->
  <button class="〇〇__nav 〇〇__nav--prev">←</button>
  <button class="〇〇__nav 〇〇__nav--next">→</button>
</div>
```

---

## 2. Swiperオプション

```javascript
import Swiper from "swiper";
import { Navigation, Autoplay } from "swiper/modules";

new Swiper('.〇〇__swiper', {
  modules: [Navigation, Autoplay],
  loop: true,
  slidesPerView: 'auto',  // CSSのアイテム幅を使用
  spaceBetween: 0,        // CSSで隙間を管理
  speed: 600,
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
  navigation: {
    prevEl: '.〇〇__nav--prev',
    nextEl: '.〇〇__nav--next',
  },
});
```

### オプション設定のポイント

| オプション | 値 | 理由 |
|-----------|-----|------|
| `slidesPerView` | `'auto'` | CSSで指定したアイテム幅を使用するため |
| `spaceBetween` | `0` | CSSのmargin-rightで隙間を管理するため（vw単位使用可） |
| `loop` | `true` | 無限ループ |

---

## 3. CSS設定

### 各要素の役割

| 要素 | 設定内容 |
|------|----------|
| `&__slider` | `max-width` + `margin: 0 auto`（中央配置） |
| `&__swiper` | `overflow: hidden` |
| `.swiper-slide` | `margin-right`（隙間）、最後の要素は`margin-right: 0` |
| `&__item` | `width`（これがスライド幅になる） |

### max-widthの計算式

```
max-width = (アイテム幅 × 表示枚数) + (隙間 × (表示枚数 - 1))
```

例：4枚表示、アイテム幅500px、隙間25pxの場合
```scss
max-width: calc(#{ppx(500)} * 4 + #{ppx(25)} * 3);
```

### SCSSサンプル

```scss
.〇〇 {
  // 外側ラッパー（max-widthと中央配置）
  &__slider {
    position: relative;
    width: 100%;
    @include tablet-up {
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

    // ★ :global()はスコープを限定するため、&__swiper内にネスト
    :global(.swiper-wrapper) {
      display: flex;
      flex-direction: column;  // SP時は縦並び
      gap: spx(25);
      @include tablet-up {
        flex-direction: row;
        gap: 0;
      }
    }

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

  // アイテム（幅はここで指定）
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

## 4. SP時のスライダー無効化

スマホ時はスライダーを無効にして縦並びリスト表示にする場合：

```javascript
const tabletBreakpoint = 744;
let swiper = null;

const initSwiper = () => {
  if (swiper) return;
  swiper = new Swiper('.〇〇__swiper', { /* オプション */ });
};

const destroySwiper = () => {
  if (swiper) {
    swiper.destroy(true, true);
    swiper = null;
  }
};

const handleResize = () => {
  if (window.innerWidth >= tabletBreakpoint) {
    initSwiper();
  } else {
    destroySwiper();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  handleResize();
  window.addEventListener('resize', handleResize);
});
```

---

## 5. 注意点

### :global()のスコープ

```scss
// ❌ NG：他のSwiperにも影響する
:global(.swiper-wrapper) { ... }

// ✅ OK：このSwiperだけに影響
&__swiper {
  :global(.swiper-wrapper) { ... }
}
```

### loopモードの警告

スライド数が少ない場合、以下の警告が出ることがある：
```
Swiper Loop Warning: The number of slides is not enough for loop mode
```

対処法：
- `loop: false` + `rewind: true`に変更（最後から最初に戻る動作）
- または、表示枚数を減らす

---

## 実装チェックリスト

- [ ] アイテム（`&__item`）を作成し、幅を指定
- [ ] Swiper構造でアイテムを囲む（`.swiper` > `.swiper-wrapper` > `.swiper-slide`）
- [ ] Swiperオプション：`slidesPerView: 'auto'`, `spaceBetween: 0`
- [ ] `&__swiper`に`overflow: hidden`を設定
- [ ] `&__slider`に`max-width`と`margin: 0 auto`を設定
- [ ] `.swiper-slide`に`margin-right`で隙間を設定
- [ ] `:global()`は`&__swiper`内にネストしてスコープを限定
- [ ] SP時のスライダー無効化処理（必要に応じて）

---

## 参考

- Swiper公式ドキュメント: https://swiperjs.com/
- 使用バージョン: Swiper 12.x
