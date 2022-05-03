export interface Gpt3ClassificationResponse {
  completion: string;
  file: string;
  label: string;
  model: string;
  object: string;
  search_model: string;
  selected_examples: [
    {
      document: number;
      label: string;
      object: string;
      score: number;
      text: string;
    },
  ];
}
