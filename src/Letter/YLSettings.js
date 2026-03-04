import "./YLSettings.css";

function YLSettings({
  goindex,
  bgmOn, setBgmOn,
  seOn, setSeOn,
  bgmVol, setBgmVol,
  seVol, setSeVol,
}) {
  return (
    <div className="settingsPage">
      <h1 className="settingsTitle">Settings</h1>

      <div className="settingsPanel">
        <div className="row">
          <div className="label">BGM</div>
          <button className="toggle" onClick={() => setBgmOn(!bgmOn)}>
            {bgmOn ? "ON" : "OFF"}
          </button>
        </div>

        <div className="row">
          <div className="label">BGM 音量</div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bgmVol}
            onChange={(e) => setBgmVol(Number(e.target.value))}
          />
          <div className="val">{Math.round(bgmVol * 100)}</div>
        </div>

        <div className="row">
          <div className="label">SE</div>
          <button className="toggle" onClick={() => setSeOn(!seOn)}>
            {seOn ? "ON" : "OFF"}
          </button>
        </div>

        <div className="row">
          <div className="label">SE 音量</div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={seVol}
            onChange={(e) => setSeVol(Number(e.target.value))}
          />
          <div className="val">{Math.round(seVol * 100)}</div>
        </div>

        <button className="backBtn" onClick={goindex}>もどる</button>
      </div>
    </div>
  );
}

export default YLSettings;