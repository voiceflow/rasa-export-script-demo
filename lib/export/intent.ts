import { BaseModels } from '@voiceflow/base-types';
import { utteranceEntityPermutations } from '@voiceflow/common';
import { RasaNluTrainingExample } from './types';
import { EntitiesByIndex, getJsonEntityLength } from './entity';

export const voiceflowToRasaIntent = (intent, slotsByID: Map<string, BaseModels.Slot>, responses: readonly string[] = []): RasaNluTrainingExample => {
  return {
    intent: intent.name,
    examples: generateRasaUtterancesForIntent(intent, slotsByID),
  };
};

export const responseNameForIntent = (intent: RasaNluTrainingExample): string => `utter_${intent.intent}`;

export const generateRasaUtterancesForIntent = (intent: BaseModels.Intent, slotMap: Map<string, BaseModels.Slot>): string[] => {
  return utteranceEntityPermutations({
    entitiesByID: Object.fromEntries(slotMap),
    utterances: intent.inputs.map((x) => x.text),
  }).map((utterance) => {
    const entitiesByStartIndex: EntitiesByIndex = new Map(utterance.entities.map((entity) => [entity.startPos, entity]));

    let plainTextBuffer = '';
    let result = '';
    for (let i = 0; i < utterance.text.length; i++) {
      if (entitiesByStartIndex.has(i)) {
        // This is the beginning of an annotation

        const entity = entitiesByStartIndex.get(i)!;
        const entityLength = getJsonEntityLength(entity);

        const sample = utterance.text.slice(i, i + entityLength + 1);

        // Add the text preceeding the annotation
        result += plainTextBuffer;
        // Flush and reset the buffer
        plainTextBuffer = '';

        const slot = slotMap.get(entity.key)!;

        // Add the annotation
        plainTextBuffer += `[${sample}](${slot.name})`;

        // Skip past this slice of text
        // Subtract 1 because the loop will i++
        i += sample.length - 1;
      } else {
        // This is a plain character
        plainTextBuffer += utterance.text[i];
      }
    }

    // Add the text after the last annotation
    result += plainTextBuffer;

    return result.trim();
  });
};
