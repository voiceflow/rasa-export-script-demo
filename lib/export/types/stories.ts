export type RasaStoryStep =
  | {
      intent: string;
    }
  | {
      action: string;
    }
  | {
      checkpoint: string;
    };

export type RasaStory = {
  story: string;
  steps: RasaStoryStep[];
};

export type RasaStoriesYml = {
  version: '3.1';
  stories: RasaStory[];
};
