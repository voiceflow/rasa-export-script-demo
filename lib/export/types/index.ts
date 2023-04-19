import { RasaDomain } from './domain';
import { RasaNluSynonym, RasaNluTrainingExample } from './nlu';
import { RasaStory } from './stories';

export type RasaProjectContainer = {
  domain: RasaDomain;
  stories: RasaStory[];
  nlu: Array<RasaNluTrainingExample | RasaNluSynonym>;
};

export * from './domain';
export * from './nlu';
export * from './stories';
