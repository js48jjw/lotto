"use client"

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { SparklesCore } from "@/components/ui/sparkles";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Component as Lightning } from "@/components/ui/lightning";
import { useMediaQuery } from 'react-responsive';

// window 객체 타입 확장
declare global {
  interface Window {
    kakaoAdFailCallback?: (insTag: HTMLElement) => void;
    kakaoAdFailCallbackTop?: (insTag: HTMLElement) => void;
    __finalAudio__?: HTMLAudioElement;
  }
}

// Memoized AdFrame component to prevent unnecessary re-renders
const AdFrame = memo(function AdFrame({ adUnit, adHeight }: { adUnit: string, adHeight: number }) {
  const adHtml = useMemo(() => `
    <html>
      <head>
        <style>body { margin: 0; padding: 0; }</style>
      </head>
      <body>
        <ins
          class="kakao_ad_area"
          style="width:100%;"
          data-ad-unit="${adUnit}"
          data-ad-width="320"
          data-ad-height="${adHeight}"
        ></ins>
        <script type="text/javascript" src="//t1.daumcdn.net/kas/static/ba.min.js" async></script>
      </body>
    </html>
  `, [adUnit, adHeight]);

  return (
    <iframe
      title={`ad-${adUnit}`}
      width="320"
      height={adHeight}
      style={{ border: 'none', overflow: 'hidden' }}
      scrolling="no"
      srcDoc={adHtml}
    />
  );
});

// Memoized number color function
const getNumberColor = (number: number): string => {
  if (number >= 1 && number <= 10) return 'bg-yellow-500'
  if (number >= 11 && number <= 20) return 'bg-blue-500'
  if (number >= 21 && number <= 30) return 'bg-red-500'
  if (number >= 31 && number <= 40) return 'bg-gray-600'
  if (number >= 41 && number <= 45) return 'bg-green-500'
  return 'bg-gray-500'
};

// Memoized static configurations
const SPARKLES_CONFIG = {
  background: "transparent",
  minSize: 0.6,
  maxSize: 1.2,
  particleDensity: 100,
  particleColor: "#00FFFF",
} as const;

const LIGHTNING_CONFIG = {
  hue: 220,
  speed: 0.7,
} as const;

const LIGHTNING_MOBILE_CONFIG = {
  intensity: 1.7,
  size: 1.2,
} as const;

const LIGHTNING_DESKTOP_CONFIG = {
  intensity: 1.2,
  size: 1.8,
} as const;

function App() {
  const [started, setStarted] = useState(false)
  const [resultCount, setResultCount] = useState(1)
  const [lottoResults, setLottoResults] = useState<{ numbers: number[]; bonus: number }[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [lightningState, setLightningState] = useState<null | 'wait' | 'active'>(null)
  const [lightningFade, setLightningFade] = useState(false)
  const [showTouchGuide, setShowTouchGuide] = useState(false);

  // Refs for cleanup
  const lightningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const finalTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initAudioRef = useRef<HTMLAudioElement | null>(null);
  const initAudioTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize media query to prevent re-computation on every render
  const isMobile = useMediaQuery({ maxWidth: 639 });

  // Memoize lightning config based on device
  const lightningConfig = useMemo(() => ({
    ...LIGHTNING_CONFIG,
    xOffset: 0,
    ...(isMobile ? LIGHTNING_MOBILE_CONFIG : LIGHTNING_DESKTOP_CONFIG),
  }), [isMobile]);

  // Service worker registration (only once)
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js");
    }
  }, []);

  // Init audio effect
  useEffect(() => {
    if (lightningState === 'wait') {
      if (!initAudioRef.current) {
        initAudioRef.current = new Audio('/sound/init.mp3');
        initAudioRef.current.loop = false;
      }
      initAudioRef.current.currentTime = 0;
      initAudioRef.current.play();

      if (initAudioTimeoutRef.current) {
        clearTimeout(initAudioTimeoutRef.current);
      }
      initAudioTimeoutRef.current = setTimeout(() => {
        if (initAudioRef.current) {
          initAudioRef.current.pause();
        }
      }, 29000);
    } else {
      if (initAudioRef.current) {
        initAudioRef.current.pause();
        initAudioRef.current.currentTime = 0;
      }
      if (initAudioTimeoutRef.current) {
        clearTimeout(initAudioTimeoutRef.current);
      }
    }

    return () => {
      if (initAudioTimeoutRef.current) {
        clearTimeout(initAudioTimeoutRef.current);
      }
    };
  }, [lightningState]);

  // Lightning active effect
  useEffect(() => {
    if (lightningState === 'active') {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sound/gogogo.mp3');
      }
      audioRef.current.currentTime = 0.4;
      audioRef.current.play();
      finalTimeoutRef.current = setTimeout(() => {
        if (!window.__finalAudio__) {
          window.__finalAudio__ = new Audio('/sound/Final.mp3');
        }
        window.__finalAudio__.currentTime = 0;
        window.__finalAudio__.play();
      }, 3000);
      lightningTimeoutRef.current = setTimeout(() => {
        setLightningFade(true)
        setTimeout(() => {
          setLightningState(null)
          setLightningFade(false)
          generateLottoNumbers()
        }, 700)
      }, 5000)
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (finalTimeoutRef.current) {
        clearTimeout(finalTimeoutRef.current)
      }
    }
  }, [lightningState]);

  // Touch guide effect
  useEffect(() => {
    let guideTimeout: NodeJS.Timeout | null = null;
    if (lightningState === 'wait') {
      setShowTouchGuide(false);
      guideTimeout = setTimeout(() => {
        setShowTouchGuide(true);
      }, 10000);
    } else {
      setShowTouchGuide(false);
      if (guideTimeout) clearTimeout(guideTimeout);
    }
    return () => {
      if (guideTimeout) clearTimeout(guideTimeout);
    };
  }, [lightningState]);

  // Memoized number generator
  const generateLottoNumbers = useCallback(() => {
    setIsGenerating(true)
    setTimeout(() => {
      const results: { numbers: number[]; bonus: number }[] = []
      for (let r = 0; r < resultCount; r++) {
        const numbers: number[] = []
        while (numbers.length < 6) {
          const num = Math.floor(Math.random() * 45) + 1
          if (!numbers.includes(num)) {
            numbers.push(num)
          }
        }
        numbers.sort((a, b) => a - b)
        let bonus: number
        do {
          bonus = Math.floor(Math.random() * 45) + 1
        } while (numbers.includes(bonus))
        results.push({ numbers, bonus })
      }
      setLottoResults(results)
      setIsGenerating(false)
    }, 2000)
  }, [resultCount]);

  // Memoized handlers
  const handleStart = useCallback(() => {
    setStarted(true)
    setLightningState('wait')
  }, []);

  const handleNewNumbers = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.__finalAudio__) {
      window.__finalAudio__.pause();
      window.__finalAudio__.currentTime = 0;
    }
    setLightningState('wait')
  }, []);

  const handleLightningTouch = useCallback(() => {
    if (lightningState === 'wait' && showTouchGuide) {
      setLightningState('active')
    }
  }, [lightningState, showTouchGuide]);

  // Memoized result options
  const resultOptions = useMemo(() => [1, 2, 3, 4, 5], []);

  // Memoized loading spinner keys
  const loadingKeys = useMemo(() => [...Array(6)].map((_, i) => i), []);

  let pageContent: React.ReactNode;
  if (!started) {
    pageContent = (
      <div className="fixed inset-0 h-screen w-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex items-center justify-center">
        <SparklesCore
          {...SPARKLES_CONFIG}
          className="absolute inset-0 w-full h-full z-0"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <div className="w-64 sm:w-96 h-24 sm:h-32 bg-cyan-400 opacity-30 blur-3xl"></div>
        </div>
        <div className="text-center z-20 p-4 sm:p-8 w-full flex flex-col items-center justify-center h-full">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold text-white mb-2 sm:mb-4">
            🎰
          </h1>
          <h2 className="font-pretendard font-black text-4xl sm:text-6xl md:text-7xl text-gray-200 mb-4 sm:mb-8 tracking-wider">
            럭키가이!!!!!
          </h2>
          <p className="text-base sm:text-xl text-gray-400 mb-6 sm:mb-12 font-light">
            당신의 행운, 지금 만나요~
          </p>
          <div className="mb-6">
            <label htmlFor="resultCount" className="text-gray-300 text-sm sm:text-lg mr-3">
              결과 개수:
            </label>
            <select
              id="resultCount"
              value={resultCount}
              onChange={(e) => setResultCount(Number(e.target.value))}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg py-2 px-4 text-sm sm:text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {resultOptions.map((num) => (
                <option key={num} value={num}>
                  {num}개
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleStart}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3 px-8 sm:py-4 sm:px-10 rounded-lg text-lg sm:text-xl transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 w-full max-w-xs mx-auto"
          >
            START
          </button>
        </div>
      </div>
    );
  } else if (lightningState) {
    pageContent = (
      <div
        className={`fixed inset-0 min-h-screen w-full bg-black flex flex-col items-center justify-center z-50 transition-opacity duration-700 ${lightningFade ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleLightningTouch}
        style={{ cursor: lightningState === 'wait' ? 'pointer' : 'default' }}
      >
        <div className="w-full h-full min-h-screen max-w-none max-h-none rounded-none shadow-none bg-black flex items-center justify-center mx-0 p-0">
          <Lightning {...lightningConfig} />
        </div>
        {lightningState === 'wait' && showTouchGuide && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center text-5xl sm:text-7xl animate-pulse pointer-events-none select-none px-2 font-bold drop-shadow-md text-white z-20">
            Touch !
          </div>
        )}
      </div>
    );
  } else {
    pageContent = (
      <div className="fixed inset-0 h-screen w-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="w-96 h-32 bg-cyan-400 opacity-30 blur-3xl"></div>
        </div>

        <div className="text-center z-10 p-4 sm:p-8 w-full flex flex-col items-center justify-center h-full">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-8 sm:mb-12 tracking-wider mt-8 sm:mt-16">
            🎰 이걸로 정했다! 🎰
          </h1>

          <div className="mb-8 sm:mb-12">
            {isGenerating ? (
              <>
                <TextShimmer className="text-lg sm:text-2xl font-bold mb-2 [--base-color:theme(colors.cyan.400)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.cyan.300)] dark:[--base-gradient-color:theme(colors.blue.400)]">
                  번호를 생성하는 중...
                </TextShimmer>
                <div className="flex flex-nowrap justify-center items-center gap-2 sm:gap-4 px-2 w-auto overflow-x-visible mt-12">
                  {loadingKeys.map((i) => (
                    <div
                      key={i}
                      className="w-9 h-9 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center animate-spin"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    >
                      <div className="w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl sm:text-4xl text-purple-300 mb-4 sm:mb-6 font-semibold">🍀 부자되세요~ 🍀</div>
                <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-md mx-auto">
                  {lottoResults.map((result, resultIndex) => (
                    <div key={resultIndex} className="flex flex-nowrap justify-center items-center gap-2 sm:gap-3 px-2 w-auto mx-auto">
                      <span className="text-white text-sm sm:text-lg font-bold mr-2">{resultIndex + 1}.</span>
                      {result.numbers.map((number, index) => (
                        <div
                          key={index}
                          className={`w-8 h-8 sm:w-10 sm:h-10 ${getNumberColor(number)} rounded-full flex items-center justify-center text-xs sm:text-base font-bold text-white shadow-lg transform hover:scale-110 transition-all duration-300 border border-white relative`}
                          style={{ 
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%), ${getNumberColor(number).replace('bg-', 'rgb(')})`,
                          }}
                        >
                          <span className="relative z-10">{number}</span>
                        </div>
                      ))}
                      <div className="text-white text-lg sm:text-xl font-bold mx-1">+</div>
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-950 rounded-full flex items-center justify-center text-xs sm:text-base font-bold text-white shadow-lg border border-white relative"
                        style={{ 
                          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%), rgb(23, 37, 84)',
                        }}
                      >
                        <span className="relative z-10">{result.bonus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-x-0 sm:space-x-4 flex flex-col sm:flex-row items-center justify-center w-full mb-8 sm:mb-12 mt-16">
            <button
              onClick={handleNewNumbers}
              disabled={isGenerating}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 sm:py-4 px-8 rounded-full text-lg sm:text-xl transform hover:scale-105 transition-all duration-300 shadow-xl disabled:cursor-not-allowed w-full sm:w-auto mb-3 sm:mb-0"
            >
              🎲 Again 
            </button>
          </div>
          <div className="mb-4 sm:mb-8 text-gray-300 text-sm sm:text-base mt-4">
            <p className="text-base sm:text-lg">🌟 행운을 빕니다! 🌟</p>
            <p className="mt-2 text-yellow-400 font-semibold text-sm sm:text-base">⚠️ 과도한 몰입은 건강을 해칠 수 있습니다</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-screen">
      <div className="fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md flex justify-center">
          <AdFrame adUnit="DAN-hS0Y5TF14lnK51lK" adHeight={50} />
        </div>
      </div>
      {pageContent}
      <div className="fixed bottom-0 left-0 w-full flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md flex justify-center">
          <AdFrame adUnit="DAN-u4HTiSfBj0E8sNUM" adHeight={100} />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <App />;
}
