export interface Gpt3PromptResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: [
    {
      text: string;
      index: number;
      logprobs: string;
      finish_reason: string;
    },
  ];
}
