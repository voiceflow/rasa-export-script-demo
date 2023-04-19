import { JSONEntity } from '@voiceflow/common';
import { VoiceflowConstants } from '@voiceflow/voiceflow-types';

export type EntitiesByIndex = ReadonlyMap<number, JSONEntity>;
export const getJsonEntityLength = (entity: Readonly<JSONEntity>): number => entity.endPos - entity.startPos;

export const SLOT_TYPE_DEFAULT_UTTERANCES: ReadonlyMap<string | VoiceflowConstants.SlotType, string[]> = new Map(
  VoiceflowConstants.SlotTypes[VoiceflowConstants.Language.EN].map((slotType) => [slotType.name, slotType.values])
);
