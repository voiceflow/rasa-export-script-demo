/*
version: "3.1"

intents:
  - affirm
  - deny
  - greet
  - thankyou
  - goodbye
  - search_concerts
  - search_venues
  - compare_reviews
  - bot_challenge
  - nlu_fallback
  - how_to_get_started

entities:
  - name

slots:
  concerts:
    type: list
    influence_conversation: false
    mappings:
    - type: custom
  venues:
    type: list
    influence_conversation: false
    mappings:
    - type: custom
  likes_music:
    type: bool
    influence_conversation: true
    mappings:
    - type: custom

responses:
  utter_greet:
    - text: "Hey there!"
  utter_goodbye:
    - text: "Goodbye :("
  utter_default:
    - text: "Sorry, I didn't get that, can you rephrase?"
  utter_youarewelcome:
    - text: "You're very welcome."
  utter_iamabot:
    - text: "I am a bot, powered by Rasa."
  utter_get_started:
    - text: "I can help you find concerts and venues. Do you like music?"
  utter_awesome:
    - text: "Awesome! You can ask me things like \"Find me some concerts\" or \"What's a good venue\""

actions:
  - action_search_concerts
  - action_search_venues
  - action_show_concert_reviews
  - action_show_venue_reviews
  - action_set_music_preference

session_config:
  session_expiration_time: 60  # value in minutes
  carry_over_slots_to_new_session: true

*/

export type RasaSlot = {
  type: 'list' | 'bool' | 'float' | 'text';
  influence_conversation: boolean;
  mappings: Array<
    | {
        type: 'custom';
      }
    | {
        type: 'from_entity';
        entity: string;
      }
    | {
        type: 'from_intent';
        intent: string;
        value: string;
        conditions: object[];
      }
  >;
};

export type RasaResponse = {
  text: string;
};

export type RasaSessionConfig = {
  session_expiration_time: number;
  carry_over_slots_to_new_session: boolean;
};

export type RasaDomain = {
  intents: string[];
  entities: string[];
  slots: Record<string, RasaSlot>;
  responses: Record<string, RasaResponse[]>;
  actions: string[];
  session_config: RasaSessionConfig;
};

export type RasaDomainYml = {
  version: '3.1';
} & RasaDomain;
