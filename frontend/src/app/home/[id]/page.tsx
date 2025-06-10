import React from "react";
import PRDetailPage, {
  type PRDetail,
} from "@/features/routes/pr_detail/components/PRDetailPage";

async function fetchPRDetail(id: string): Promise<PRDetail> {
  // 実際のAPIコール例
  // const res = await fetch(`https://api.example.com/prs/${id}`, {
  //   next: { revalidate: 300 }
  // });
  // return res.json();

  // 仮データ
  return {
    id: parseInt(id),
    title: "feat: Add dark mode support with automatic theme detection",
    repository: "facebook/react",
    status: "merged",
    lastUpdated: "2時間前",
    goods: 234,
    author: "johndoe",
    authorAvatar: "JD",
    summary:
      "このPRは、Reactアプリケーションにダークモードサポートを追加し、ユーザーのシステム設定に基づいて自動的にテーマを切り替える機能を実装しています。CSS変数を使用した効率的なテーマ管理と、パフォーマンスを考慮した実装が特徴です。",
    background: `## 背景
多くのユーザーがダークモードを好むようになり、特に開発者コミュニティでは目の疲れを軽減するためにダークモードが広く使用されています。

## 目的
1. ユーザーエクスペリエンスの向上
2. アクセシビリティの改善
3. バッテリー消費の削減（OLEDディスプレイ使用時）
4. 最新のWeb標準への対応`,
    changes: [
      {
        filename: "src/hooks/useTheme.ts",
        additions: 145,
        deletions: 0,
        status: "new",
      },
      {
        filename: "src/components/ThemeProvider.tsx",
        additions: 89,
        deletions: 0,
        status: "new",
      },
      {
        filename: "src/styles/theme.css",
        additions: 234,
        deletions: 45,
        status: "modified",
      },
      {
        filename: "src/App.tsx",
        additions: 23,
        deletions: 12,
        status: "modified",
      },
      {
        filename: "src/utils/theme.ts",
        additions: 67,
        deletions: 0,
        status: "new",
      },
    ],
    changeSummary: [
      "新しいカスタムフック`useTheme`を追加し、テーマの状態管理を実装",
      "ThemeProviderコンポーネントを作成し、アプリケーション全体でテーマコンテキストを提供",
      "CSS変数を使用したテーマシステムを構築し、効率的なスタイル切り替えを実現",
      "prefers-color-scheme メディアクエリを使用して、システム設定に基づく自動テーマ検出を実装",
      "localStorage を使用してユーザーのテーマ設定を永続化",
    ],
    highlights: [
      {
        type: "technical",
        title: "メディアクエリリスナーの効率的な実装",
        description:
          "window.matchMediaを使用してシステムのテーマ変更をリアルタイムで検出し、自動的にアプリケーションのテーマを更新します。メモリリークを防ぐため、cleanup関数で適切にリスナーを削除しています。",
        code: `useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, []);`,
        language: "typescript",
      },
      {
        type: "architecture",
        title: "CSS変数を使用したテーマアーキテクチャ",
        description:
          "CSS変数を使用することで、JavaScriptでの動的なスタイル計算を避け、ブラウザのネイティブな機能を活用しています。これにより、テーマ切り替え時のパフォーマンスが大幅に向上します。",
        code: `:root {
  --color-background: #ffffff;
  --color-text: #000000;
  --color-primary: #0066cc;
}

[data-theme="dark"] {
  --color-background: #1a1a1a;
  --color-text: #ffffff;
  --color-primary: #66b3ff;
}`,
        language: "css",
      },
      {
        type: "performance",
        title: "フラッシュ防止のための初期化最適化",
        description:
          "ページ読み込み時のテーマフラッシュを防ぐため、クリティカルなスクリプトをheadタグ内で実行し、bodyのレンダリング前にテーマを設定しています。",
        code: `// index.html の <head> 内に配置
<script>
  (function() {
    const theme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>`,
        language: "javascript",
      },
    ],
  };
}

const page = async ({ params }: { params: { id: string } }) => {
  const pr = await fetchPRDetail(params.id);
  return <PRDetailPage pr={pr} />;
};

// メタデータの生成
export async function generateMetadata({ params }: { params: { id: string } }) {
  const pr = await fetchPRDetail(params.id);

  return {
    title: `${pr.title} - ${pr.repository}`,
    description: pr.summary,
  };
}

export default page;
