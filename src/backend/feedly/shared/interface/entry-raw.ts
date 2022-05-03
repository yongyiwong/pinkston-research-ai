export interface EntryRaw {
  id: string;
  keywords: any;
  title: string;
  origin: {
    title: string;
    htmlUrl: string;
  };
  author?: string;
  published: number;
  summary: {
    content: string;
  };
  canonical?: [
    {
      href?: string;
    },
  ];
  canonicalUrl: string;
  commonTopics: any;
  entities: any;
}

export interface EntryRawsFetch {
  id: string;
  updated: number;
  continuation: string;
  items: EntryRaw[];
}
