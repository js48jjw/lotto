"use client"

import { useState, useRef, useEffect } from 'react'
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

function KakaoAd() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  // 광고 실패 콜백 등록
  useEffect(() => {
    window.kakaoAdFailCallback = function(insTag: HTMLElement) {
      // 광고 실패 시 동작 (예: 광고 영역 숨기기)
      if (insTag && insTag.style) {
        insTag.style.display = "none";
      }
      // 필요시 setShow(false) 등 추가 동작 가능
    };
    return () => {
      delete window.kakaoAdFailCallback;
    };
  }, []);

  useEffect(() => {
    if (show) {
      // 이미 스크립트가 있으면 추가하지 않음
      if (!document.querySelector('script[src="//t1.daumcdn.net/kas/static/ba.min.js"]')) {
        const script = document.createElement("script");
        script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
          document.body.removeChild(script);
        };
      }
    }
  }, [show]);

  if (!show) return null;

  return (
    <ins
      className="kakao_ad_area"
      style={{ display: "none", width: "100%" }}
      data-ad-unit="DAN-u4HTiSfBj0E8sNUM"
      data-ad-width="320"
      data-ad-height="100"
      data-ad-onfail="kakaoAdFailCallback"
    ></ins>
  );
}

function KakaoAdTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  useEffect(() => {
    window.kakaoAdFailCallbackTop = function(insTag: HTMLElement) {
      if (insTag && insTag.style) {
        insTag.style.display = "none";
      }
    };
    return () => {
      delete window.kakaoAdFailCallbackTop;
    };
  }, []);

  useEffect(() => {
    if (show) {
      // 이미 스크립트가 있으면 추가하지 않음
      if (!document.querySelector('script[src="//t1.daumcdn.net/kas/static/ba.min.js"]')) {
        const script = document.createElement("script");
        script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
          document.body.removeChild(script);
        };
      }
    }
  }, [show]);

  if (!show) return null;

  return (
    <ins
      className="kakao_ad_area"
      style={{ display: "none", width: "100%" }}
      data-ad-unit="DAN-hS0Y5TF14lnK51lK"
      data-ad-width="320"
      data-ad-height="50"
      data-ad-onfail="kakaoAdFailCallbackTop"
    ></ins>
  );
}

function App() {
  const [started, setStarted] = useState(false)
  const [lottoNumbers, setLottoNumbers] = useState<number[]>([])
  const [bonusNumber, setBonusNumber] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lightningState, setLightningState] = useState<null | 'wait' | 'active'>(null)
  const [lightningFade, setLightningFade] = useState(false)
  const lightningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const finalTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initAudioRef = useRef<HTMLAudioElement | null>(null);
  const finalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [showTouchGuide, setShowTouchGuide] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 639 });

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js");
      });
    }
  }, []);

  useEffect(() => {
    if (lightningState === 'wait') {
      if (!initAudioRef.current) {
        initAudioRef.current = new Audio('/sound/init.mp3');
        initAudioRef.current.loop = true;
      }
      initAudioRef.current.currentTime = 0;
      initAudioRef.current.play();
    } else {
      if (initAudioRef.current) {
        initAudioRef.current.pause();
        initAudioRef.current.currentTime = 0;
      }
    }
  }, [lightningState]);

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

  // 번개화면 대기 진입 시 10초 후 안내 표시
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

  const getNumberColor = (number: number) => {
    if (number >= 1 && number <= 10) return 'bg-yellow-500'
    if (number >= 11 && number <= 20) return 'bg-blue-500'
    if (number >= 21 && number <= 30) return 'bg-red-500'
    if (number >= 31 && number <= 40) return 'bg-gray-600'
    if (number >= 41 && number <= 45) return 'bg-green-500'
    return 'bg-gray-500'
  }

  const generateLottoNumbers = () => {
    setIsGenerating(true)
    setTimeout(() => {
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
      setLottoNumbers(numbers)
      setBonusNumber(bonus)
      setIsGenerating(false)
    }, 2000)
  }

  const handleStart = () => {
    setStarted(true)
    setLightningState('wait')
  }

  const handleNewNumbers = () => {
    if (finalAudioRef.current) {
      finalAudioRef.current.pause();
      finalAudioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined') {
      if (window.__finalAudio__) {
        window.__finalAudio__.pause();
        window.__finalAudio__.currentTime = 0;
      }
    }
    setLightningState('wait')
  }

  const handleLightningTouch = () => {
    if (lightningState === 'wait' && showTouchGuide) {
      setLightningState('active')
    }
  }

  let pageContent: React.ReactNode;
  if (!started) {
    pageContent = (
      <div className="fixed inset-0 h-screen w-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex items-center justify-center">
        <SparklesCore
          background="transparent"
          minSize={0.6}
          maxSize={1.2}
          particleDensity={100}
          className="absolute inset-0 w-full h-full z-0"
          particleColor="#00FFFF"
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
          <Lightning
            hue={220}
            xOffset={isMobile ? 0 : 0}
            speed={0.7}
            intensity={isMobile ? 1.7 : 1.2}
            size={isMobile ? 1.2 : 1.8}
          />
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
                  {[...Array(6)].map((_, i) => (
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
                <div className="text-2xl sm:text-4xl text-purple-300 mb-2 font-semibold">🍀 부자되세요~ 🍀</div>
                <div className="flex flex-nowrap justify-center items-center gap-2 sm:gap-4 px-2 w-auto overflow-x-visible mt-12">
                  {lottoNumbers.map((number, index) => (
                    <div
                      key={index}
                      className={`w-9 h-9 sm:w-12 sm:h-12 ${getNumberColor(number)} rounded-full flex items-center justify-center text-sm sm:text-lg font-bold text-white shadow-2xl transform hover:scale-110 transition-all duration-300 animate-bounce border-2 border-white relative`}
                      style={{ 
                        animationDelay: `${index * 0.2}s`,
                        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%), ${getNumberColor(number).replace('bg-', 'rgb(')})`,
                        boxShadow: 'inset -2px -2px 8px rgba(0,0,0,0.3), inset 2px 2px 8px rgba(255,255,255,0.3), 0 8px 16px rgba(0,0,0,0.3)'
                      }}
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                      <span className="relative z-10">{number}</span>
                    </div>
                  ))}
                  <div className="text-white text-2xl sm:text-3xl font-bold mx-2 sm:mx-4">+</div>
                  <div
                    className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-950 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold text-white shadow-2xl transform hover:scale-110 transition-all duration-300 animate-bounce border-2 border-white relative"
                    style={{ 
                      animationDelay: '1.4s',
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%), rgb(23, 37, 84)',
                      boxShadow: 'inset -2px -2px 8px rgba(0,0,0,0.3), inset 2px 2px 8px rgba(255,255,255,0.3), 0 8px 16px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                    <span className="relative z-10">{bonusNumber}</span>
                  </div>
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
        <div className="pointer-events-auto w-full max-w-md">
          <KakaoAdTop />
        </div>
      </div>
      {pageContent}
      <div className="fixed bottom-0 left-0 w-full flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md">
          <KakaoAd />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js");
      });
    }
  }, []);
  return <App />;
}