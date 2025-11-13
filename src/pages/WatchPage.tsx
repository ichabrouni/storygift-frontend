// src/pages/WatchPage.tsx
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type VideoDoc = {
  title: string;
  url: string;
  videoId: string;
};

export function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState<VideoDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const snap = await getDoc(doc(db, "videos", id!));
        if (!snap.exists()) {
          setError("Video not found.");
          return;
        }
        setVideo(snap.data() as VideoDoc);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load video.");
      }
    })();
  }, [id]);

  if (error) return <div style={{ color: "#c00" }}>{error}</div>;
  if (!video) return <div>Loading…</div>;

  return (
    <div>
      <h2>{video.title}</h2>
      <div style={{ width: "100%", maxWidth: 900, aspectRatio: "16 / 9" }}>
        <iframe
          title={video.title}
          src={`https://www.youtube-nocookie.com/embed/${video.videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: 0, borderRadius: 8 }}
        />
      </div>
      <p style={{ marginTop: 8 }}>
        Share link: <code>{window.location.href}</code>
      </p>
    </div>
  );
}