// src/pages/ShareVideoPage.tsx
import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./share-video.css";

function extractYouTubeId(raw: string): string | null {
  if (!raw) return null;
  const url = raw.trim();
  const short = url.match(/^https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{6,})/i);
  if (short?.[1]) return short[1];
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/i);
  if (watch?.[1]) return watch[1];
  const embed = url.match(/\/embed\/([a-zA-Z0-9_-]{6,})/i);
  if (embed?.[1]) return embed[1];
  const shorts = url.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/i);
  if (shorts?.[1]) return shorts[1];
  return null;
}

export function ShareVideoPage() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const videoId = useMemo(() => extractYouTubeId(url), [url]);
  const isValid = !!videoId && !!title.trim();

  const onSubmit = async () => {
    setError(null);

    if (!auth.currentUser) {
      setError("Please sign in first to save your StoryBox.");
      return;
    }
    if (!isValid) {
      setError("Add a title and a valid YouTube link.");
      return;
    }

    setSaving(true);
    try {
      const ref = await addDoc(collection(db, "videos"), {
        title: title.trim(),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      navigate(`/watch/${ref.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save your gift.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sv-page">
      <div className="sv-bg-glow" />
      <div className="sv-card">
        <div className="sv-step-chip">Step 1 · Create your StoryBox</div>

        <h1 className="sv-title">Add your video message</h1>
        <p className="sv-subtitle">
          Paste a YouTube link with your message or memory. We’ll attach it to the NFC tag
          so your loved one can watch it anytime.
        </p>

        <div className="sv-layout">
          {/* Left: form */}
          <div className="sv-form">
            <label className="sv-label">Who is this gift for?</label>
            <input
              className="sv-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='E.g. "I love you, mom"'
            />

            <label className="sv-label">Paste your YouTube link</label>
            <input
              className="sv-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
            />

            {error && <div className="sv-error">{error}</div>}

            <button
              className="sv-save-btn"
              onClick={onSubmit}
              disabled={!isValid || saving}
            >
              {saving ? "Saving your gift…" : "Save & get gift link"}
            </button>

            <p className="sv-helper-text">
              After saving, you’ll receive a unique link to write to the NFC tag on your gift.
              Only you can change this video later.
            </p>
          </div>

          {/* Right: preview */}
          <div className="sv-preview">
            {videoId ? (
              <>
                <div className="sv-preview-label">Live preview</div>
                <div className="sv-video-frame">
                  <iframe
                    title="Video preview"
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <p className="sv-preview-caption">
                  This is how your StoryBox will look when they tap the Box.
                </p>
              </>
            ) : (
              <div className="sv-video-placeholder">
                <span className="sv-video-emoji">🎬</span>
                <div className="sv-video-title">Your video preview will appear here</div>
                <div className="sv-video-text">
                  Paste a YouTube link and we’ll show you the exact preview your loved one will see.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}