import { useEffect, useMemo, useState } from "react";
import "./YLWrite.css";
import { db, storage, auth } from "../firebase"; 
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

function YLWrite({goindex, selectedBinsen, goback, mode = "someone" }) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null);

  const senderText = useMemo(() => {
    return mode === "someone"
      ? "どこかの私より"
      : mode === "past"
      ? "未来の私より"
      : "過去の私より";
  }, [mode]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const withTimeout = (promise, ms, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms)
      ),
    ]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type || "";
    const sizeMB = file.size / 1024 / 1024;

    if (type === "image/heic" || type === "image/heif") {
      setToast("HEIC/HEIFは未対応です。JPG/PNGで選び直してね");
      e.target.value = "";
      return;
    }
    if (sizeMB > 10) {
      setToast(`画像が大きすぎます（${sizeMB.toFixed(2)}MB）。10MB以下にしてね`);
      e.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(url);
  };

  const openConfirm = () => {
    const body = text.trim();
    if (body.length === 0) return setToast("本文は1文字以上入力してね");
    if (body.length > 120) return setToast("120文字以下にしてください");
    setShowConfirm(true);
  };

  const resetForm = () => {
    setText("");
    setImageFile(null);
    setImagePreview(null);
    setConfirmed(false);
    setShowConfirm(false);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const body = text.trim();
    if (!body) return setToast("本文が空です");
    if (!confirmed) return setToast("確認チェックを入れてから送信してね");


    const uid = auth.currentUser?.uid;
    if (!uid) return setToast("ログイン準備中です。数秒後にもう一度送信してね");

    setSubmitting(true);

    try {
      let imageUrl = "";

      if (imageFile) {
        const safeName = (imageFile.name || "image").replace(/\s+/g, "_");
        const filePath = `letters/${mode}/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, filePath);

        const blob = await imageFile
          .arrayBuffer()
          .then((buf) => new Blob([buf], { type: imageFile.type }));

        await withTimeout(
          uploadBytes(storageRef, blob, { contentType: imageFile.type }),
          15000,
          "uploadBytes"
        );

        imageUrl = await withTimeout(
          getDownloadURL(storageRef),
          15000,
          "getDownloadURL"
        );
      }

      await withTimeout(
        addDoc(collection(db, "letters"), {
          text: body,
          mode,
          binsenUrl: selectedBinsen || "",
          imageUrl,
          uid, 
          createdAt: serverTimestamp(),
        }),
        15000,
        "addDoc"
      );

      resetForm();
      setToast("投稿が完了しました");
    } catch (e) {
      const code = e?.code ? `(${e.code}) ` : "";
      const msg = e?.message || String(e);
      setToast(`投稿に失敗: ${code}${msg}`);
      console.error("submit error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="write-page">
      <h1 className="write-title">My Letter</h1>

      <div
        className="letter-sheet"
        style={selectedBinsen ? { backgroundImage: `url(${selectedBinsen})` } : undefined}
      >
        <div className="panel panel-photo">
          {imagePreview ? (
            <img className="photo-preview" src={imagePreview} alt="preview" />
          ) : (
            <label className="photo-upload">
              <span className="photo-upload-text">写真を載せる</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
                disabled={submitting}
              />
            </label>
          )}
        </div>

        <div className="panel panel-text">
          <p className="to-text">どこかのあなたへ</p>

          <textarea
            className="letter-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={120}
            placeholder="文字を入力（1文字以上120文字以内）"
            disabled={submitting}
          />

          <p className="from-text">{senderText}</p>
        </div>
      </div>

      <div className="write-actions">
        <button className="wsend-btn" onClick={openConfirm} disabled={submitting}>
          送信する
        </button>

        <button className="wback-btn" onClick={goback} disabled={submitting}>
          前画面へ戻る
        </button>
        <button className = "idxbtn" onClick = {goindex} disabled = {submitting}>メニューへ戻る</button>
      </div>

      {showConfirm && (
        <div
          className="confirm-overlay"
          onClick={() => {
            if (submitting) return;
            setShowConfirm(false);
            setConfirmed(false);
          }}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="beforesub">投稿前の確認</h2>

            <ul className="memo">
              <li>個人情報（住所・学校名・電話番号など）は書かないでください</li>
              <li>誰かや自分を傷つける言葉は使わないでください</li>
              <li>自分で撮影した、または転載が許可されている写真のみを使ってください</li>
            </ul>

            <label className="confirm-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={submitting}
              />
              確認した
            </label>

            <div className="confirm-actions">
              <button
                className="chancelbtn"
                onClick={() => {
                  if (submitting) return;
                  setShowConfirm(false);
                  setConfirmed(false);
                }}
                disabled={submitting}
              >
                キャンセル
              </button>

              <button
                type="button"
                className="okbtn"
                onClick={handleSubmit}
                disabled={!confirmed || submitting}
              >
                {submitting ? "送信中..." : "送信確定"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-overlay">
          <div className="toast-panel">{toast}</div>
        </div>
      )}
    </div>
  );
}

export default YLWrite;