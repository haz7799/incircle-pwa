import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 核心背景色
        background: "#f5f5f5", // 極淺灰，用於整個 App 底色，降低視覺疲勞
        surface: "#ffffff",    // 純白，用於卡片、對話框、選單
        
        // 核心文字與元件色
        primary: "#171717",    // 近純黑，用於主要標題、重要按鈕與 Icon
        secondary: "#525252",  // 中深灰，用於次要資訊、時間、地點描述
        muted: "#a3a3a3",      // 淺灰，用於佔位符 (Placeholder)、不可點擊狀態
        
        // 邊界與裝飾
        border: "#e5e5e5",     // 極淺灰，用於分隔線與輸入框邊框
      },
      boxShadow: {
        // 輕量級陰影，符合極簡扁平化風格
        'minimal': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};

export default config;