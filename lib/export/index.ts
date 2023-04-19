import { BaseModels, BaseNode, Utils } from '@voiceflow/base-types';
import { VoiceflowConstants, VoiceflowModels } from '@voiceflow/voiceflow-types';
import fs from 'fs/promises';
import path from 'path';
import { getSteps } from './diagram';
import { voiceflowToRasaIntent } from './intent';
import { RasaNluTrainingExample, RasaProjectContainer } from './types';
import { isCustomType, sanitizeResourceName, slateToPlaintext } from './utils';
import { zipIntents } from './zip';
import { responseNameForIntent } from './intent';
import { SLOT_TYPE_DEFAULT_UTTERANCES } from './entity';

async function main() {
  // get first parameter from command line
  const [, , ...args] = process.argv;

  const readFilePath = args[0] || 'project.vf';
  const { dir: readFileDirectory, name: readFileName } = path.parse(readFilePath);

  console.log(`Reading ${readFileName}`);

  const content = JSON.parse(await fs.readFile(readFilePath, 'utf8')) as VoiceflowModels.VF;
  const diagrams = content.diagrams;
  const platformData = content.version.platformData;

  const intentMap: Map<string, BaseModels.Intent> = new Map(platformData.intents.map((intent: BaseModels.Intent) => [intent.key, intent] as const));

  const slotMap = new Map<string, BaseModels.Slot>(
    platformData.slots.map((slot: BaseModels.Slot) => {
      return [
        slot.key,
        {
          ...slot,
          name: sanitizeResourceName(slot.name),
        },
      ];
    })
  );

  const rasaProject: RasaProjectContainer = {
    domain: {
      intents: [],
      entities: [],
      slots: {},
      responses: {},
      actions: [],
      session_config: {
        // Example values
        session_expiration_time: 60,
        carry_over_slots_to_new_session: true,
      },
    },
    stories: [],
    nlu: [],
  };

  for (const diagram of Object.values(diagrams)) {
    const steps = getSteps(diagram);
    const stepsArray = Array.from(steps.values());

    for (const [index, step] of stepsArray.entries()) {
      if (step.type === BaseNode.NodeType.INTENT && step.data?.intent) {
        const intent = intentMap.get(step.data.intent);
        if (!intent) continue;

        intent.name = sanitizeResourceName(intent.name);

        for (const slot of intent.slots.map((slot) => slotMap.get(slot.id))) {
          const defaultUtterances = SLOT_TYPE_DEFAULT_UTTERANCES.get(slot.type.value);
          if (defaultUtterances) {
            // This is a built-in slot, so we need to add in the default utterances
            slot.inputs.push(...defaultUtterances);
          }
        }

        let rasaIntent: RasaNluTrainingExample;

        let responses: string[] = [];

        // Get the next step, and check if it's a speak or text step
        const nextStep = stepsArray[index + 1];
        if (Utils.step.isText(nextStep)) {
          responses = nextStep.data.texts.map((dialog) => slateToPlaintext(dialog.content));
        } else if (Utils.step.isSpeak(nextStep)) {
          responses = nextStep.data.dialogs.map((dialog) => dialog.content);
        }

        console.dir(
          intent.slots.map((slot) => slotMap.get(slot.id)),
          { depth: null }
        );

        rasaIntent = voiceflowToRasaIntent(intent, slotMap, responses);

        const [response] = responses;

        if (response) {
          rasaProject.domain.responses[responseNameForIntent(rasaIntent)] = [
            {
              text: response,
            },
          ];

          rasaProject.stories.push({
            story: rasaIntent.intent,
            steps: [
              {
                intent: rasaIntent.intent,
              },
              {
                action: responseNameForIntent(rasaIntent),
              },
            ],
          });
        } else {
          rasaProject.stories.push({
            story: rasaIntent.intent,
            steps: [
              {
                intent: rasaIntent.intent,
              },
            ],
          });
        }

        rasaProject.nlu.push(rasaIntent);
        rasaProject.domain.intents.push(rasaIntent.intent);
      }
    }
  }

  // Entities
  for (const slot of slotMap.values()) {
    for (const input of slot.inputs) {
      const [canonical, ...synonyms] = input.split(',');

      if (synonyms.length === 0) {
        // We don't need to register synonyms if there's nothing to add
        continue;
      }

      rasaProject.nlu.push({
        synonym: canonical.trim().toLowerCase(),
        examples: synonyms.map((synonym) => synonym.trim().toLowerCase()),
      });
    }
    rasaProject.domain.entities.push(sanitizeResourceName(slot.name));
  }

  const exportFileName = `${readFileName}.zip`;
  const writePathName = path.join(readFileDirectory, exportFileName);

  await zipIntents(rasaProject, writePathName);

  console.log(`Successfully exported project to ${exportFileName}`);
}

main();
