/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const recipes = require('./recipes');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

/* INTENT HANDLERS */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const Ryuusho = requestAttributes.t(getRandomRyuusho(Object.keys(recipes.RECIPE_ja_JP)));

    const speakOutput = requestAttributes.t('WELCOME_MESSAGE', requestAttributes.t('SKILL_NAME'), Ryuusho);
    const repromptOutput = requestAttributes.t('WELCOME_REPROMPT');

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

const RecipeHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'RecipeIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const RyuushoSlot = handlerInput.requestEnvelope.request.intent.slots.Ryuusho;
    let RyuushoName;
    if (RyuushoSlot && RyuushoSlot.value) {
      RyuushoName = RyuushoSlot.value.toLowerCase();
    }

    const cardTitle = requestAttributes.t('DISPLAY_CARD_TITLE', requestAttributes.t('SKILL_NAME'), RyuushoName);
    const myRecipes = requestAttributes.t('RECIPES');
    const recipe = myRecipes[RyuushoName];
    let speakOutput = "";

    if (recipe) {
      sessionAttributes.speakOutput = recipe;
      //sessionAttributes.repromptSpeech = requestAttributes.t('RECIPE_REPEAT_MESSAGE');
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      return handlerInput.responseBuilder
        .speak(sessionAttributes.speakOutput) // .reprompt(sessionAttributes.repromptSpeech)
        .withSimpleCard(cardTitle, recipe)
        .getResponse();
    }
    else{
      speakOutput = requestAttributes.t('RECIPE_NOT_FOUND_MESSAGE');
      const repromptSpeech = requestAttributes.t('RECIPE_NOT_FOUND_REPROMPT');
      if (RyuushoName) {
        speakOutput += requestAttributes.t('RECIPE_NOT_FOUND_WITH_Ryuusho_NAME', RyuushoName);
      } else {
        speakOutput += requestAttributes.t('RECIPE_NOT_FOUND_WITHOUT_Ryuusho_NAME');
      }
      speakOutput += repromptSpeech;

      sessionAttributes.speakOutput = speakOutput; //saving speakOutput to attributes, so we can use it to repeat
      sessionAttributes.repromptSpeech = repromptSpeech;

      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      return handlerInput.responseBuilder
        .speak(sessionAttributes.speakOutput)
        .reprompt(sessionAttributes.repromptSpeech)
        .getResponse();
    }
  }
};

const HelpHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const Ryuusho = requestAttributes.t(getRandomRyuusho(Object.keys(recipes.RECIPE_ja_JP)));

    sessionAttributes.speakOutput = requestAttributes.t('HELP_MESSAGE', Ryuusho);
    sessionAttributes.repromptSpeech = requestAttributes.t('HELP_REPROMPT', Ryuusho);

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .reprompt(sessionAttributes.repromptSpeech)
      .getResponse();
  },
};

const RepeatHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .reprompt(sessionAttributes.repromptSpeech)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = requestAttributes.t('STOP_MESSAGE', requestAttributes.t('SKILL_NAME'));

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log("Inside SessionEndedRequestHandler");
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  },
};


const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('聞き取れませんでした、もう一度お願いします。Sorry, I can\'t understand the command. Please say again.')
      .reprompt('すみません、質問がよく理解できません。もう一度お願いします。Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

/* CONSTANTS */
const skillBuilder = Alexa.SkillBuilders.custom();
const languageStrings = {
  ja: {
    translation: {
      RECIPES: recipes.RECIPE_ja_JP,
      SKILL_NAME: '流山高校商業科',
      WELCOME_MESSAGE: '流山高校のことを何でも答えます。どうぞ聞いてみてください。',
      WELCOME_REPROMPT: '例えば、「行事予定を教えて」や「簿記検定はいつ」などと聞いてみてください。',
      DISPLAY_CARD_TITLE: '%s  - Recipe for %s.',
      HELP_MESSAGE: '例えば、「時間割を教えて」や「簿記検定はいつ」などと聞いてみてください。',
      HELP_REPROMPT: '例えば、「時間割を教えて」や「簿記検定はいつ」などと聞いてみてください。',
      STOP_MESSAGE: 'Goodbye!',
      RECIPE_REPEAT_MESSAGE: 'もう一度お願いします。.',
      RECIPE_NOT_FOUND_MESSAGE: '今はまだわかりません',
      RECIPE_NOT_FOUND_WITH_Ryuusho_NAME: 'the recipe for %s. ',
      RECIPE_NOT_FOUND_WITHOUT_Ryuusho_NAME: 'that recipe. ',
      RECIPE_NOT_FOUND_REPROMPT: '何かほかに聞きたいことはありませんか。'
    },
  },
  'en-US': {
    translation: {
        RECIPES: recipes.RECIPE_EN_US,
        SKILL_NAME: 'Ngareyama Highschool of Business',
        WELCOME_MESSAGE: 'Welcome to Nagareyama. You can ask a question like, what\'s the events schedule ? ... Now, what can I help you with?',
        WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',
        DISPLAY_CARD_TITLE: '%s  - Recipe for %s.',
        HELP_MESSAGE: 'You can ask questions such as, what\'s the next exam, or, you can say exit...Now, what can I help you with?',
        HELP_REPROMPT: 'You can say things like, what\'s the events schedule, or you can say exit...Now, what can I help you with?',
        STOP_MESSAGE: 'Goodbye!',
        RECIPE_REPEAT_MESSAGE: 'Try saying repeat.',
        RECIPE_NOT_FOUND_MESSAGE: 'I\'m sorry, I currently do not know ',
        RECIPE_NOT_FOUND_WITH_Ryuusho_NAME: 'the recipe for %s. ',
        RECIPE_NOT_FOUND_WITHOUT_Ryuusho_NAME: 'that recipe. ',
        RECIPE_NOT_FOUND_REPROMPT: 'What else can I help with?'
    },
  }, 
};

// Finding the locale of the user
const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageStrings,
      returnObjects: true
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    };
  },
};

// getRandomRyuusho
function getRandomRyuusho(arrayOfRyuushos) {
  // the argument is an array [] of words or phrases
  let i = 0;
  i = Math.floor(Math.random() * arrayOfRyuushos.length);
  return (arrayOfRyuushos[i]);
};

/* LAMBDA SETUP */
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    RecipeHandler,
    HelpHandler,
    RepeatHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
