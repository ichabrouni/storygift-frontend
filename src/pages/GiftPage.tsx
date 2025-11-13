// src/pages/GiftPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import "../pages/gift-page.css"

type GiftDoc = {
  title?: string;
  url?: string;
  videoId?: string;
  ownerId?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

/**
 * Robust YouTube ID extractor – accepts almost any YouTube URL
 */
function extractYouTubeId(raw: string): string | null {
  if (!raw) return null;

  try {
    const url = new URL(raw.trim());

    // 1) ?v=XXXXXXXX
    const vParam = url.searchParams.get("v");
    if (vParam && vParam.length >= 6) return vParam;

    // 2) youtu.be/XXXXXXXX
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      if (id && id.length >= 6) return id;
    }

    // 3) /embed/XXXXXXXX
    const embedMatch = url.pathname.match(/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch?.[1]) return embedMatch[1];

    // 4) /shorts/XXXXXXXX
    const shortsMatch = url.pathname.match(/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch?.[1]) return shortsMatch[1];

    // 5) fallback: try to read v= from full string
    const hashMatch = raw.match(/v=([a-zA-Z0-9_-]{6,})/);
    if (hashMatch?.[1]) return hashMatch[1];

    return null;
  } catch {
    return null;
  }
}

export function GiftPage() {
  const { giftId } = useParams<{ giftId: string }>();
  const [user, setUser] = useState<User | null>(null);

  const [gift, setGift] = useState<GiftDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Auth listener ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  // --- Load gift document ---
  useEffect(() => {
    if (!giftId) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ref = doc(db, "gifts", giftId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setNotFound(true);
          setGift(null);
        } else {
          const data = snap.data() as GiftDoc;
          setGift(data);
          setTitle(data.title ?? "");
          setUrl(data.url ?? "");
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load this StoryGift.");
      } finally {
        setLoading(false);
      }
    })();
  }, [giftId]);

  const youtubeId = useMemo(() => extractYouTubeId(url), [url]);
  const isValid = !!title.trim() && !!youtubeId;

  // --- Ownership logic ---
  const ownerId = gift?.ownerId ?? null;
  const isOwner = !!user && !!ownerId && ownerId === user.uid;
  const isUnclaimed =
    gift && (ownerId === null || ownerId === undefined || ownerId === "");
  const canEdit = !!user && (isOwner || isUnclaimed);

  const onSave = async () => {
    if (!user) {
      setError("Please sign in to claim this StoryGift.");
      return;
    }
    if (!canEdit) {
      setError("Only the original sender can edit this StoryGift.");
      return;
    }
    if (!isValid || !youtubeId) {
      setError("Please add a title and a valid YouTube link.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const ref = doc(db, "gifts", giftId!);
      await updateDoc(ref, {
        title: title.trim(),
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        videoId: youtubeId,
        ownerId: ownerId || user.uid,
        updatedAt: serverTimestamp(),
      });

      setGift((prev) => ({
        ...(prev ?? {}),
        title: title.trim(),
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        videoId: youtubeId,
        ownerId: ownerId || user.uid,
      }));
    } catch (e: any) {
      setError(e?.message ?? "Failed to save your StoryGift.");
    } finally {
      setSaving(false);
    }
  };

  // --- Render states ---
  if (loading) {
    return (
      <div className="gift-page-bg">
        <div className="gift-loading">Loading your StoryGift…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="gift-page-bg">
        <div className="gift-card">
          <div className="gift-error">
            This StoryGift could not be found. Please check the link.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gift-page-bg">
      <div className="gift-glow" />

      {/* Card */}
      <div className="gift-card">
        {/* Header */}
        <div className="gift-header">
          <div className="gift-brand">
            <span className="gift-logo-dot" />
            <span className="gift-brand-title">StoryGift</span>
          </div>
          <div className="gift-subtitle">An emotional moment stored in a tiny tag</div>
          <h1 className="gift-main-title">A video message that lives inside your gift</h1>
        </div>

        {/* Divider */}
        <div className="gift-divider">
          <span className="gift-divider-line" />
          <span className="gift-divider-icon"> </span>
          <span className="gift-divider-line" />
        </div>

        {/* NEW: show the custom title/message (if set) */}
        {gift?.title && (
          <div className="gift-message-title">
            {gift.title}
          </div>
        )}

        {/* Video area */}
        <div className="gift-video-wrapper">
          {gift?.videoId ? (
            <div className="gift-video-frame">
              <iframe
                title={gift.title || "StoryGift video"}
                src={`https://www.youtube-nocookie.com/embed/${gift.videoId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="gift-video-placeholder">
              <span className="gift-video-emoji">🎬</span>
              <div>No video has been added yet.</div>
              <div className="gift-video-small">
                If you are the sender of the gift, you can log in and attach your message here.
              </div>
            </div>
          )}
        </div>

        <div className="gift-receiver-text">
          This StoryGift link lives on an NFC tag inside a physical gift. Every time it&apos;s tapped,
          this page opens and plays the story attached to it.
        </div>

        {/* Edit / Claim panel – ONLY for people who can edit */}
        {canEdit && (
          <div className="gift-edit-panel">
            <h3 className="gift-edit-title">Claim this StoryGift</h3>
            <p className="gift-edit-subtitle">
              Add a title and a YouTube link with your message, song or memory. You can always come
              back and update it later.
            </p>

            <label className="gift-label">Title on the gift</label>
            <input
              className="gift-input"
              placeholder='For example: "For the love of my life"'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />

            <label className="gift-label">YouTube link</label>
            <input
              className="gift-input"
              placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={saving}
            />

            <button
              className="gift-save-button"
              onClick={onSave}
              disabled={!isValid || saving}
            >
              {saving
                ? "Saving…"
                : isUnclaimed
                ? "SAVE & CLAIM THIS STORYGIFT"
                : "SAVE CHANGES"}
            </button>

            <div className="gift-claim-note">
              {!user && (
                <>To claim and edit this StoryGift, please sign in using the button at the top.</>
              )}
              {user && isUnclaimed && (
                <>You&apos;re signed in. When you save, this StoryGift will be linked to your account.</>
              )}
              {user && isOwner && (
                <>This StoryGift belongs to you. You can update the video and title anytime.</>
              )}
            </div>

            {error && (
              <div className="gift-error-text" style={{ marginTop: 8 }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* READ-ONLY note for recipients (no editing UI) */}
        {!canEdit && !isUnclaimed && (
          <div className="gift-owner-note">
            This message was created with love by someone special. Only the person who created this
            StoryGift can change it.
          </div>
        )}

        {/* Any load/save error in read-only state */}
        {!canEdit && error && (
          <div className="gift-error-text" style={{ marginTop: 8 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}