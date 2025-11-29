import React, { useState, useEffect, useCallback } from 'react';
import AnalogClock from './components/AnalogClock';
import OptionButton from './components/OptionButton';
import DigitalTimeInput from './components/DigitalTimeInput';
import { generateTimeScenario, getEncouragement } from './services/geminiService';
import { Difficulty, TimeTarget, ScenarioResponse, GameMode } from './types';

const App: React.FC = () => {
  // Config State
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.QUIZ);
  const [is24Hour, setIs24Hour] = useState(false);

  // Game State
  const [targetTime, setTargetTime] = useState<TimeTarget>({ hours: 12, minutes: 0 });
  const [userTime, setUserTime] = useState<TimeTarget>({ hours: 12, minutes: 0 }); // For Input/Set Hands modes
  const [options, setOptions] = useState<TimeTarget[]>([]);
  
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null); // For Quiz mode
  
  const [scenario, setScenario] = useState<ScenarioResponse>({ scenario: "Загрузка...", emoji: "⌛" });
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Helper: Format time as string "12:00" or "14:00"
  const formatTime = (t: TimeTarget, use24: boolean) => {
    let h = t.hours;
    if (!use24) {
      // Convert to 12h for display
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
    }
    return `${h}:${t.minutes.toString().padStart(2, '0')}`;
  };

  // Helper: Generate a random time
  const getRandomTime = (diff: Difficulty, use24: boolean): TimeTarget => {
    // Determine max hour based on mode, but analog clock logic usually simpler 1-12.
    // However, if 24h is enabled, we want scenarios like 14:00.
    const maxHour = use24 ? 24 : 12;
    // random 0..23 or 0..11
    let h = Math.floor(Math.random() * maxHour);
    if (!use24 && h === 0) h = 12; // 12h format uses 12 instead of 0
    
    let m = 0;
    if (diff === Difficulty.EASY) {
      m = 0;
    } else if (diff === Difficulty.MEDIUM) {
      m = Math.random() < 0.5 ? 0 : 30;
    } else {
      m = Math.floor(Math.random() * 12) * 5;
    }
    return { hours: h, minutes: m };
  };

  // Helper: Generate distractors (wrong answers)
  const generateOptions = (correct: TimeTarget, diff: Difficulty, use24: boolean) => {
    const opts: TimeTarget[] = [correct];
    while (opts.length < 3) {
      const random = getRandomTime(diff, use24);
      // Ensure unique options
      if (!opts.some(o => o.hours === random.hours && o.minutes === random.minutes)) {
        opts.push(random);
      }
    }
    return opts.sort(() => Math.random() - 0.5);
  };

  // Setup new round
  const startNewRound = useCallback(async () => {
    setLoading(true);
    setHasAnswered(false);
    setSelectedOptionIndex(null);
    setFeedbackMessage("");
    setUserTime({ hours: 12, minutes: 0 });

    const newTarget = getRandomTime(difficulty, is24Hour);
    setTargetTime(newTarget);

    if (gameMode === GameMode.QUIZ) {
      setOptions(generateOptions(newTarget, difficulty, is24Hour));
    } else if (gameMode === GameMode.SET_HANDS) {
      // Start user clock at random time so they have to move it
      setUserTime(getRandomTime(difficulty, false)); 
    } else if (gameMode === GameMode.INPUT) {
      // Start user input at 12:00
      setUserTime({ hours: is24Hour ? 0 : 12, minutes: 0 });
    }

    try {
      const result = await generateTimeScenario(newTarget.hours, newTarget.minutes);
      setScenario(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [difficulty, is24Hour, gameMode]);

  // Initial load
  useEffect(() => {
    startNewRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, gameMode, is24Hour]); 

  // --- Handlers ---

  const handleQuizOptionClick = async (option: TimeTarget, index: number) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setSelectedOptionIndex(index);

    const isCorrect = option.hours === targetTime.hours && option.minutes === targetTime.minutes;
    processAnswer(isCorrect);
  };

  const handleCheckAnswer = async () => {
    if (hasAnswered) return;
    setHasAnswered(true);

    let isCorrect = false;

    if (gameMode === GameMode.INPUT) {
       isCorrect = userTime.hours === targetTime.hours && userTime.minutes === targetTime.minutes;
    } else if (gameMode === GameMode.SET_HANDS) {
      // For analog, we check normalized 12h values
      // If target is 14:00 (2pm) and user sets 2:00, that is CORRECT.
      const targetH12 = targetTime.hours % 12 || 12;
      const userH12 = userTime.hours % 12 || 12;
      
      isCorrect = targetH12 === userH12 && userTime.minutes === targetTime.minutes;
    }

    processAnswer(isCorrect);
  };

  const processAnswer = async (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 1);
    }
    const msg = await getEncouragement(isCorrect);
    setFeedbackMessage(msg);

    if (isCorrect) {
      // Reduced delay to 1.5s for faster flow
      setTimeout(startNewRound, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center py-6 px-4 font-sans select-none">
      
      {/* Settings Bar */}
      <div className="w-full max-w-xl flex flex-wrap gap-3 justify-center mb-4">
        {/* Mode Selector */}
        <div className="bg-white rounded-xl p-1 shadow-sm flex border border-slate-200">
           <button 
             onClick={() => setGameMode(GameMode.QUIZ)} 
             className={`px-3 py-1 rounded-lg text-xs font-bold ${gameMode === GameMode.QUIZ ? 'bg-kid-blue text-white' : 'text-slate-400'}`}
           >
             Тест
           </button>
           <button 
             onClick={() => setGameMode(GameMode.INPUT)} 
             className={`px-3 py-1 rounded-lg text-xs font-bold ${gameMode === GameMode.INPUT ? 'bg-kid-blue text-white' : 'text-slate-400'}`}
           >
             Ввод
           </button>
           <button 
             onClick={() => setGameMode(GameMode.SET_HANDS)} 
             className={`px-3 py-1 rounded-lg text-xs font-bold ${gameMode === GameMode.SET_HANDS ? 'bg-kid-blue text-white' : 'text-slate-400'}`}
           >
             Часы
           </button>
        </div>

        {/* Format Toggle */}
        <button 
          onClick={() => setIs24Hour(!is24Hour)}
          className="bg-white border border-slate-200 text-slate-500 text-xs font-bold px-4 py-1 rounded-xl shadow-sm hover:bg-slate-50"
        >
          {is24Hour ? '24 Часа' : '12 Часов'}
        </button>

        {/* Difficulty */}
        <div className="bg-white rounded-xl p-1 shadow-sm flex border border-slate-200">
          <button 
            onClick={() => setDifficulty(Difficulty.EASY)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${difficulty === Difficulty.EASY ? 'bg-kid-green text-white' : 'text-slate-400'}`}
          >
            Легко
          </button>
          <button 
            onClick={() => setDifficulty(Difficulty.MEDIUM)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${difficulty === Difficulty.MEDIUM ? 'bg-kid-yellow text-slate-800' : 'text-slate-400'}`}
          >
            Средне
          </button>
          <button 
            onClick={() => setDifficulty(Difficulty.HARD)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${difficulty === Difficulty.HARD ? 'bg-kid-pink text-white' : 'text-slate-400'}`}
          >
            Сложно
          </button>
        </div>
      </div>

      {/* Score */}
      <div className="mb-6 flex flex-col items-center">
        <span className="text-3xl font-black text-kid-purple">{score} ⭐</span>
      </div>

      {/* Main Game Area */}
      <main className="w-full max-w-md flex flex-col items-center gap-6">
        
        {/* Scenario Bubble */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border-b-8 border-slate-200 w-full text-center relative mt-4">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl bg-white rounded-full p-2 shadow-sm border-4 border-sky-100">
             {scenario.emoji}
          </div>
          <p className="mt-6 text-lg text-slate-600 font-medium leading-relaxed">
            {loading ? "Придумываю задание..." : scenario.scenario}
          </p>
        </div>

        {/* --- QUIZ MODE & INPUT MODE: Show Static Target Clock --- */}
        {(gameMode === GameMode.QUIZ || gameMode === GameMode.INPUT) && (
          <div className="p-4 bg-white rounded-full shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] border-8 border-white">
            <AnalogClock hours={targetTime.hours} minutes={targetTime.minutes} size={280} />
          </div>
        )}

        {/* --- SET HANDS MODE: Show Interactive Clock --- */}
        {gameMode === GameMode.SET_HANDS && (
           <div className="p-4 bg-white rounded-full shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] border-8 border-white">
             <AnalogClock 
               hours={userTime.hours} 
               minutes={userTime.minutes} 
               size={280} 
               interactive={!hasAnswered} 
               onTimeChange={(h, m) => setUserTime({ hours: h, minutes: m })}
             />
           </div>
        )}

        {/* Instruction Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-700">
            {gameMode === GameMode.SET_HANDS ? `Поставь часы на:` : `Который час?`}
          </h2>
          {gameMode === GameMode.SET_HANDS && (
             <div className="text-4xl font-mono font-bold text-kid-blue mt-2 bg-white px-6 py-2 rounded-xl shadow-inner inline-block">
               {formatTime(targetTime, is24Hour)}
             </div>
          )}
        </div>

        {/* --- Controls --- */}
        
        {/* QUIZ Options */}
        {gameMode === GameMode.QUIZ && (
          <div className="grid grid-cols-1 gap-4 w-full">
            {options.map((opt, idx) => {
              let state: 'default' | 'correct' | 'wrong' = 'default';
              if (hasAnswered) {
                const isThisCorrect = opt.hours === targetTime.hours && opt.minutes === targetTime.minutes;
                if (isThisCorrect) state = 'correct';
                else if (selectedOptionIndex === idx) state = 'wrong';
              }
              return (
                <OptionButton
                  key={`${opt.hours}-${opt.minutes}-${idx}`}
                  timeStr={formatTime(opt, is24Hour)}
                  onClick={() => handleQuizOptionClick(opt, idx)}
                  disabled={hasAnswered}
                  state={state}
                />
              );
            })}
          </div>
        )}

        {/* INPUT Controls */}
        {gameMode === GameMode.INPUT && (
          <div className="w-full flex flex-col gap-4">
            <DigitalTimeInput 
               hours={userTime.hours} 
               minutes={userTime.minutes}
               is24Hour={is24Hour}
               onChange={(h, m) => setUserTime({ hours: h, minutes: m })}
               disabled={hasAnswered}
            />
            <button 
              onClick={handleCheckAnswer}
              disabled={hasAnswered}
              className="w-full py-4 bg-kid-green text-white font-bold text-xl rounded-2xl shadow-lg border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
            >
              Проверить
            </button>
          </div>
        )}

        {/* SET HANDS Controls */}
        {gameMode === GameMode.SET_HANDS && (
          <button 
            onClick={handleCheckAnswer}
            disabled={hasAnswered}
            className="w-full py-4 bg-kid-green text-white font-bold text-xl rounded-2xl shadow-lg border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
          >
            Готово!
          </button>
        )}

        {/* Feedback Bar */}
        {hasAnswered && (
          <div className={`
            fixed bottom-0 left-0 w-full p-6 text-center text-white font-bold text-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50
            ${feedbackMessage.includes("Попробуй") ? 'bg-orange-400' : 'bg-kid-green'}
            animate-bounce-slow
          `}>
            {feedbackMessage}
            {!feedbackMessage.includes("Попробуй") && (
               <span className="block text-sm mt-2 opacity-90 font-normal">Следующий вопрос скоро...</span>
            )}
            {feedbackMessage.includes("Попробуй") && (
               <button 
                onClick={() => {
                   setHasAnswered(false);
                   setFeedbackMessage("");
                   // Reset visual state for wrong answer if needed
                   if (gameMode === GameMode.QUIZ) setSelectedOptionIndex(null);
                }}
                className="mt-3 bg-white text-orange-400 text-sm px-6 py-2 rounded-full shadow-lg hover:bg-orange-50"
               >
                 Еще раз
               </button>
            )}
          </div>
        )}

      </main>

      <footer className="mt-12 text-slate-400 text-sm font-medium">
        Учим время с ИИ 🤖
      </footer>
    </div>
  );
};

export default App;