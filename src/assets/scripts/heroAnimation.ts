import { gsap } from "gsap";

// DOMが読み込まれた後にアニメーションを実行
document.addEventListener("DOMContentLoaded", () => {
  const firstRowChars = document.querySelectorAll(
    ".hero__title-row.first .hero__title-char",
  );
  const secondRowChars = document.querySelectorAll(
    ".hero__title-row.second .hero__title-char",
  );

  // 要素が見つからない場合は処理をスキップ
  if (firstRowChars.length === 0 || secondRowChars.length === 0) {
    return;
  }

  // first行のアニメーション
  gsap.to(firstRowChars, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power2.out",
    stagger: {
      amount: 0.8, // 全体で0.8秒かけて順次表示（一文字あたり約0.2秒）
      from: "start",
    },
    onComplete: () => {
      // first行が完了したら、ワンテンポ（0.3秒）待ってからsecond行を開始
      setTimeout(() => {
        gsap.to(secondRowChars, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: {
            amount: 0.8, // 全体で0.8秒かけて順次表示（一文字あたり約0.2秒）
            from: "start",
          },
        });
      }, 300); // ワンテンポ（0.3秒）
    },
  });
});
