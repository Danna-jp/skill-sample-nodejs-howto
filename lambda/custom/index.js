/* eslint-disable  func-names */
/* eslint-disable  no-console */

//SDKを使いますよ
const Alexa = require('ask-sdk-core');
//recipesという外部ファイルを参照しますよ
const recipes = require('./recipes');
//多言語対応
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

/* INTENTを処理するHANDLERSを最下部の宣言どおりに並べて記述 */
const LaunchRequestHandler = {
  //canHandleでこのハンドラーを使うかどうかを判別して、使うならhandleメソッドにtrueを返す
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  //handleで実際のハンドラーの処理を記述していく
  handle(handlerInput) {
    //Atrributesを使ってセッションの間記録することを宣言
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //外部のRecipes.jsというランダムに配列している外部モジュールを定義
    const Ryuusho = requestAttributes.t(getRandomRyuusho(Object.keys(recipes.RECIPE_ja_JP)));
    //speakOutput＝アレクサのウェルカムメッセージとrepromptOutput＝質問をするを定義
    const speakOutput = requestAttributes.t('WELCOME_MESSAGE', requestAttributes.t('SKILL_NAME'), Ryuusho);
    const repromptOutput = requestAttributes.t('WELCOME_REPROMPT');
    //スキルのセッションンの進み具合を記録しておく
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    //LaunchRequestの実際の応答を定義
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};
//流商のことを聞かれて応答するハンドラー
const RecipeHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'RecipeIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    //RyuushoSlotをRyuushoNameとして定義
    const RyuushoSlot = handlerInput.requestEnvelope.request.intent.slots.Ryuusho;
    //RyuushoNameで応答の内容を選択
    let RyuushoName;
    if (RyuushoSlot && RyuushoSlot.value) {
      RyuushoName = RyuushoSlot.value.toLowerCase();
    }

    const cardTitle = requestAttributes.t('DISPLAY_CARD_TITLE', requestAttributes.t('SKILL_NAME'), RyuushoName);
    const myRecipes = requestAttributes.t('RECIPES');
    const recipe = myRecipes[RyuushoName];
    let speakOutput = "";

    if(RyuushoName == '体験入学') {
    sessionAttributes.speakOutput = recipe;
    //sessionAttributes.repromptSpeech = requestAttributes.t('RECIPE_REPEAT_MESSAGE');
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    const largeImageUrl = 'https://s3-ap-northeast-1.amazonaws.com/ryuusyo/taiken(1).jpg';
    const smallImageUrl = 'https://s3-ap-northeast-1.amazonaws.com/ryuusyo/taiken(2).jpg';
    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput) // .reprompt(sessionAttributes.repromptSpeech)
      .withStandardCard('体験入学ポスター', 'まだの方はぜひご参加ください！', smallImageUrl, largeImageUrl)
      .getResponse();
  }
    else if (recipe) {
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

/* LAMBDA SETUP　上から順にどのハンドラーを使うか確かめていく */
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
