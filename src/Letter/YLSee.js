import { useCallback, useEffect, useState } from "react";
import "./YLSee.css";
import { db, auth } from "../firebase";
import d1 from "./22140475_s.jpg";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

function YLSee({ selectedBinsen, goindex, initialTab }) {
  console.log("selectedBinsen:", selectedBinsen);

  const likedKey = (id) => `yl_like_${id}`;
  const isLikedLocal = (id) => localStorage.getItem(likedKey(id)) === "1";

  const [posts, setPosts] = useState([]);
  const [myUid, setMyUid] = useState(null);

  const PAGE_SIZE = 50;

  const [loadingFirst, setLoadingFirst] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [toast, setToast] = useState(null);
  const [likingId, setLikingId] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setMyUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  const buildBaseConds = useCallback(() => {
    if (!initialTab) return null;

    const needUid = initialTab === "past" || initialTab === "future";
    if (needUid && !myUid) return null;

    return [
      where("mode", "==", initialTab),
      ...(needUid ? [where("uid", "==", myUid)] : []),
      orderBy("createdAt", "desc"),
    ];
  }, [initialTab, myUid]);

  const handleLike = async (letterId) => {
    if (!myUid) {
      setToast("ログイン準備中です。少し待ってから押してね");
      return;
    }
    if (likingId) return;
    if (isLikedLocal(letterId)) return;

    setLikingId(letterId);

    localStorage.setItem(likedKey(letterId), "1");
    setPosts((prev) =>
      prev.map((p) =>
        p.id === letterId ? { ...p, likesCount: (p.likesCount || 0) + 1 } : p
      )
    );

    try {
      await updateDoc(doc(db, "letters", letterId), {
        likesCount: increment(1),
      });
    } catch (e) {
      localStorage.removeItem(likedKey(letterId));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === letterId
            ? { ...p, likesCount: Math.max((p.likesCount || 1) - 1, 0) }
            : p
        )
      );

      const code = e?.code ? `(${e.code}) ` : "";
      const msg = e?.message || String(e);
      console.error("like error:", e);
      setToast(`いいね失敗: ${code}${msg}`);
    } finally {
      setLikingId(null);
    }
  };

  const handleDelete = async (letterId) => {
    const ok = window.confirm("この手紙を削除しますか？");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "letters", letterId));
      setPosts((prev) => prev.filter((p) => p.id !== letterId));
      localStorage.removeItem(likedKey(letterId));
      setToast("削除しました");
    } catch (e) {
      const code = e?.code ? `(${e.code}) ` : "";
      const msg = e?.message || String(e);
      console.error("delete error:", e);
      setToast(`削除失敗: ${code}${msg}`);
    }
  };

  const fetchFirst = useCallback(async () => {
    const base = buildBaseConds();
    if (!base) {
      return;
    }

    const q = query(collection(db, "letters"), ...base, limit(PAGE_SIZE));

    setLoadingFirst(true);
    try {
      const snap = await getDocs(q);
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setPosts(arr);

      const last = snap.docs[snap.docs.length - 1] || null;
      setLastDoc(last);

      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error("取得エラー", e);
      const code = e?.code ? `(${e.code}) ` : "";
      const msg = e?.message || String(e);
      setToast(`取得失敗: ${code}${msg}`);

      setPosts([]);
      setLastDoc(null);
      setHasMore(false);
    } finally {
      setLoadingFirst(false);
    }
  }, [buildBaseConds]);

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    const base = buildBaseConds();
    if (!base) return;

    const q = query(
      collection(db, "letters"),
      ...base,
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );

    setLoadingMore(true);
    try {
      const snap = await getDocs(q);

      if (snap.empty) {
        setHasMore(false);
        return;
      }

      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts((prev) => [...prev, ...arr]);

      const last = snap.docs[snap.docs.length - 1] || null;
      setLastDoc(last);

      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error("追加取得エラー", e);
      const code = e?.code ? `(${e.code}) ` : "";
      const msg = e?.message || String(e);
      setToast(`追加取得失敗: ${code}${msg}`);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, buildBaseConds]);

  useEffect(() => {
    fetchFirst();
  }, [fetchFirst]);


  const explanationPost = {
    id: "__explain__",
    text:
      initialTab === "future"
        ? "今の気持ちを少しだけ未来のあなたに残してみませんか？"
        : initialTab === "past"
        ? "今だから言える言葉を、過去のあなたに届けてみませんか？"
        : "短い手紙を気軽に投函してみよう。",

    binsenUrl: selectedBinsen || "",

    system: true,

    imageUrl: "",
    likesCount: 0,
  };


  const displayPosts = [...posts, explanationPost];

  return (
    <div className="timelinebackground">
      <h1 className="timeline">Letters</h1>

      <div className="timelinelistpanel">
        {displayPosts.map((post) => {
          const liked = isLikedLocal(post.id);

          const toText =
            initialTab === "past"
              ? "過去のわたしへ"
              : initialTab === "future"
              ? "未来のわたしへ"
              : "どこかの誰かへ";

          const fromText =
            initialTab === "past"
              ? "未来のわたしより"
              : initialTab === "future"
              ? "過去のわたしより"
              : "どこかの私より";

          const photoSrc = post.imageUrl || d1;
          const binsenBg = post.binsenUrl;

          return (
            <div
              key={post.id}
              className={`letterItem ${post.system ? "systemPost" : ""}`}
              style={{
                backgroundImage: binsenBg ? `url(${binsenBg})` : "none",
              }}
            >
    
              {!post.system && post.uid && post.uid === myUid && (
                <button
                  className="deleteBtn"
                  onClick={() => handleDelete(post.id)}
                >
                  消去
                </button>
              )}

              <div className="photoWrap">
                <img className="sphoto" src={photoSrc} alt="" />
              </div>

              <div className="ppanel">
                <div className="Totext">{toText}</div>
                <div className="letterText">{post.text}</div>
                <div className="fromText">{fromText}</div>
              </div>

           
              {!post.system && (
                <button
                  className={`likeBtn ${liked ? "liked" : ""}`}
                  onClick={() => handleLike(post.id)}
                  disabled={liked || likingId === post.id}
                >
                  {liked ? "❤︎" : "♡"} {post.likesCount || 0}
                </button>
              )}
            </div>
          );
        })}

        <button className="sseebackbtn" onClick={goindex}>
          戻る
        </button>

        {hasMore && posts.length > 0 && !loadingFirst && (
          <button
            className="loadMoreBtn"
            onClick={fetchMore}
            disabled={loadingMore}
          >
            {loadingMore ? "読み込み中..." : "もっと読む"}
          </button>
        )}
      </div>

      {toast && (
        <div className="toast-overlay">
          <div className="toast-panel">{toast}</div>
        </div>
      )}
    </div>
  );
}

export default YLSee;