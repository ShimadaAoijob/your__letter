import { useEffect, useRef, useState, useCallback } from "react";
import YLTitle from "./YLTitle";
import YLIndex from "./YLIndex";
import YLTo from "./YLTo";
import YLBinsen from "./YLBinsen";
import YLWrite from "./YLWrite";
import YLSee from "./YLSee";
import YLSettings from "./YLSettings";

import { auth } from "../firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

function YLApp() {
  const [page, setPage] = useState("title");
  const [purpose, setPurpose] = useState(null);
  const [mode, setMode] = useState(null);
  const [selectedBinsen, setSelectedBinsen] = useState(null);

  const [bgmOn, setBgmOn] = useState(() => localStorage.getItem("yl_bgmOn") !== "0");
  const [seOn, setSeOn] = useState(() => localStorage.getItem("yl_seOn") !== "0");
  const [bgmVol, setBgmVol] = useState(() => Number(localStorage.getItem("yl_bgmVol") ?? "0.2"));
  const [seVol, setSeVol] = useState(() => Number(localStorage.getItem("yl_seVol") ?? "0.2"));

  const bgmRef = useRef(null);


  const seCtxRef = useRef(null);
  const seBufRef = useRef(null);
  const seReadyRef = useRef(false);


  const seFallbackRef = useRef(null);

  const persistSettings = (next) => {
    if ("bgmOn" in next) localStorage.setItem("yl_bgmOn", next.bgmOn ? "1" : "0");
    if ("seOn" in next) localStorage.setItem("yl_seOn", next.seOn ? "1" : "0");
    if ("bgmVol" in next) localStorage.setItem("yl_bgmVol", String(next.bgmVol));
    if ("seVol" in next) localStorage.setItem("yl_seVol", String(next.seVol));
  };


  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    seCtxRef.current = ctx;

    (async () => {
      try {
        const res = await fetch("/SE_1.mp3", { cache: "force-cache" });
        const arr = await res.arrayBuffer();
        seBufRef.current = await ctx.decodeAudioData(arr);
        seReadyRef.current = true;
      } catch (e) {
        console.log("SE decode failed (fallback will be used):", e);
        seReadyRef.current = false;
      }
    })();

    return () => {
      try {
        ctx.close();
      } catch {}
    };
  }, []);

  
  const unlockAudio = useCallback(async () => {
    const ctx = seCtxRef.current;
    if (ctx && ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {}
    }

    
    const a = seFallbackRef.current;
    if (a) {
      try {
        a.load();
      } catch {}
    }
  }, []);


  const playSE = useCallback(async () => {
    if (!seOn) return;


    await unlockAudio();

    const ctx = seCtxRef.current;
    const buf = seBufRef.current;

 
    if (ctx && buf && seReadyRef.current) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = buf;

        const gain = ctx.createGain();
        gain.gain.value = seVol;

        src.connect(gain).connect(ctx.destination);
        src.start(0);
        return;
      } catch (e) {
        console.log("WebAudio SE play error:", e);

      }
    }

    const a = seFallbackRef.current;
    if (!a) return;
    try {
      a.volume = seVol;
      a.currentTime = 0;
      await a.play();
    } catch (e) {
      console.log("SE fallback error:", e);
    }
  }, [seOn, seVol, unlockAudio]);


  const startApp = async () => {
    
    await unlockAudio();

    setPage("index");
    try {
      if (bgmOn && bgmRef.current) {
        bgmRef.current.volume = bgmVol;
        await bgmRef.current.play();
      }
    } catch (e) {
      console.log("BGM blocked:", e);
    }
  };

  // BGM on/off & volume
  useEffect(() => {
    const a = bgmRef.current;
    if (!a) return;

    a.volume = bgmVol;

    if (bgmOn) {
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [bgmOn, bgmVol]);


  const goindex = () => setPage("index");
  const gotitle = () => setPage("title");
  const goto = () => setPage("to");
  const goprevBinsen = () => setPage("binsen");
  const gosettings = () => setPage("settings");

  const gosee = () => {
    setPurpose("see");
    setPage("to");
  };
  const gowrite = () => {
    setPurpose("write");
    setPage("to");
  };


  useEffect(() => {
    let signingIn = false;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) return;
      if (signingIn) return;

      signingIn = true;
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("ログイン失敗", e);
      } finally {
        signingIn = false;
      }
    });

    return () => unsub();
  }, []);

  return (
    <div>

      <audio ref={bgmRef} src="/USE.mp3" loop preload="auto" />

      <audio ref={seFallbackRef} src="/SE_1.mp3" preload="auto" />

      {page === "title" && <YLTitle onStart={startApp} />}

      {page === "index" && (
        <YLIndex
          gotitle={() => {
            playSE();
            gotitle();
          }}
          gowrite={() => {
            playSE();
            gowrite();
          }}
          gosee={() => {
            playSE();
            gosee();
          }}
          gosettings={() => {
            playSE();
            gosettings();
          }}
        />
      )}

      {page === "to" && (
        <YLTo
          goindex={() => {
            playSE();
            goindex();
          }}
          onDecide={(selectedTo) => {
            playSE();
            setMode(selectedTo);

            if (purpose === "see") setPage("see");
            else setPage("binsen");
          }}
        />
      )}

      {page === "binsen" && (
        <YLBinsen
          goto={() => {
            playSE();
            goto();
          }}
          onDecide={(binsenImg) => {
            playSE();
            setSelectedBinsen(binsenImg);
            setPage("write");
          }}
        />
      )}

      {page === "write" && (
        <YLWrite
          selectedBinsen={selectedBinsen}
          mode={mode}
          goback={() => {
            playSE();
            goprevBinsen();
          }}
          goindex={() => {
            playSE();
            goindex();
          }}
        />
      )}

      {page === "see" && (
        <YLSee
          goindex={() => {
            playSE();
            goto();
          }}
          initialTab={mode}
          selectedBinsen={selectedBinsen}
        />
      )}

      {page === "settings" && (
        <YLSettings
          goindex={() => {
            playSE();
            goindex();
          }}
          bgmOn={bgmOn}
          setBgmOn={(v) => {
            setBgmOn(v);
            persistSettings({ bgmOn: v });
          }}
          seOn={seOn}
          setSeOn={(v) => {
            setSeOn(v);
            persistSettings({ seOn: v });
          }}
          bgmVol={bgmVol}
          setBgmVol={(v) => {
            setBgmVol(v);
            persistSettings({ bgmVol: v });
          }}
          seVol={seVol}
          setSeVol={(v) => {
            setSeVol(v);
            persistSettings({ seVol: v });
          }}
        />
      )}
    </div>
  );
}

export default YLApp;