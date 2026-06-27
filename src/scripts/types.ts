export type ThemeStore = {
  isDark: boolean;
  init(): void;
  toggle(): void;
};

export type LanguageStore = {
  lang: string;
  init(): void;
  setLang(lang: string): void;
};
