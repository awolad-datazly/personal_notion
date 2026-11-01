export type ScrapedNewsItem = {
  title: string;
  url: string;
  summary?: string;
  category: string;
};

export type NewsListFilter = "all" | "must-learn";
