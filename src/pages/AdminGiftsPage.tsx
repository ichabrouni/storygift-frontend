// src/pages/AdminGiftsPage.tsx
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase";
import "../pages/AdminGiftPage.css"

type Gift = {
  id: string;
  ownerId?: string | null;
  title?: string | null;
  videoId?: string | null;
  url?: string | null;
  createdAt?: Timestamp;
};

// ✅ emails that are allowed to use the admin page
const ADMIN_EMAILS = [
  "ichabrouni@intelligenttech.se",
  "storyboxsales@gmail.com",
];

export function AdminGiftsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const origin = window.location.origin;

  // --- auth listener ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("AdminGiftsPage user:", u?.email);
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // --- load all gifts (no Firestore index required) ---
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const snap = await getDocs(collection(db, "gifts"));
        const list: Gift[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });

        // sort newest → oldest by createdAt
        list.sort((a, b) => {
          const ta =
            a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
          const tb =
            b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });

        setGifts(list);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Failed to load gifts.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- create blank gift for NFC tag ---
  const onCreateGift = async () => {
    if (!user) {
      setError("Please sign in as admin to create gifts.");
      return;
    }
    if (!ADMIN_EMAILS.includes(user.email ?? "")) {
      setError("Access denied. Only admin accounts can create gifts.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const now = Timestamp.now();
      const ref = await addDoc(collection(db, "gifts"), {
        title: "",
        ownerId: null,      // will be set when buyer claims it
        videoId: null,
        url: null,
        createdAt: now,
      });

      setGifts((prev) => [
        { id: ref.id, title: "", ownerId: null, videoId: null, url: null, createdAt: now },
        ...prev,
      ]);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to create gift.");
    } finally {
      setCreating(false);
    }
  };

  // --- delete gift ---
  const onDeleteGift = async (id: string) => {
    const ok = window.confirm(
      "Are you sure you want to delete this StoryGift link? The video will no longer be accessible from this tag."
    );
    if (!ok) return;

    setDeletingId(id);
    setError(null);
    try {
      await deleteDoc(doc(db, "gifts", id));
      setGifts((prev) => prev.filter((g) => g.id !== id));
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to delete StoryGift.");
    } finally {
      setDeletingId(null);
    }
  };

  // --- render states ---
  if (authLoading) {
    return <div className="storygift-main-admin">Checking access…</div>;
  }

  if (!user) {
    return (
      <div className="storygift-main-admin">
        <p>Please sign in to manage StoryGifts.</p>
      </div>
    );
  }

  if (!ADMIN_EMAILS.includes(user.email ?? "")) {
    return (
      <div className="storygift-main-admin">
        <p>Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <main className="storygift-main-admin">
      <section className="admin-gifts-hero">
        <h1>Your StoryGifts</h1>
        <p>
          Here you can see all the StoryGifts you created, open them, or delete a
          link if you no longer want it to be available.
        </p>
        <button
          className="gift-save-button admin-gifts-create-btn"
          onClick={onCreateGift}
          disabled={creating}
        >
          {creating ? "Creating…" : "Create new StoryGift"}
        </button>
      </section>

      {error && (
        <div className="gift-error-text" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 24 }}>Loading gifts…</div>
      ) : gifts.length === 0 ? (
        <div className="admin-gifts-empty">
          You don’t have any StoryGifts yet. Click{" "}
          <strong>“Create new StoryGift”</strong> to start.
        </div>
      ) : (
        <section className="admin-gifts-list">
          {gifts.map((g) => {
            const link = `${origin}/gift/${g.id}`;
            const hasVideo = !!g.videoId;
            const created =
              g.createdAt instanceof Timestamp
                ? new Date(g.createdAt.toMillis()).toLocaleDateString()
                : "—";
            const title = g.title?.trim() || "Untitled StoryGift";

            return (
              <article key={g.id} className="admin-gift-card">
                <div className="admin-gift-header">
                  <div>
                    <div className="admin-gift-title">{title}</div>
                    <div className="admin-gift-meta">Created: {created}</div>
                  </div>
                  <span
                    className={
                      "admin-gift-status " +
                      (hasVideo
                        ? "admin-gift-status--ready"
                        : "admin-gift-status--empty")
                    }
                  >
                    {hasVideo ? "Has video" : "No video yet"}
                  </span>
                </div>

                <div className="admin-gift-link">
                  <span>{link}</span>
                </div>

                <div className="admin-gift-actions">
                  <button
                    type="button"
                    className="admin-gift-btn"
                    onClick={() => window.open(link, "_blank")}
                  >
                    Open page
                  </button>
                  <button
                    type="button"
                    className="admin-gift-btn"
                    onClick={() => navigator.clipboard.writeText(link)}
                  >
                    Copy link
                  </button>
                  <a
                    className="admin-gift-btn admin-gift-btn--outline"
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      link
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open QR
                  </a>
                  <button
                    type="button"
                    className="admin-gift-btn admin-gift-btn--danger"
                    onClick={() => onDeleteGift(g.id)}
                    disabled={deletingId === g.id}
                  >
                    {deletingId === g.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}