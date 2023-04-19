/** @see https://rasa.com/docs/rasa/training-data-format#training-examples */
export type RasaNluTrainingExample = {
  intent: string;
  examples: string[];
};

/** @see https://rasa.com/docs/rasa/training-data-format#synonyms */
export type RasaNluSynonym = {
  synonym: string;
  examples: string[];
};

export type RasaNluYml = {
  version: '3.1';
  nlu: Array<RasaNluTrainingExample | RasaNluSynonym>;
};

export type RasaEntityAnnotation = {
  entity: string;
  value?: string;
};
