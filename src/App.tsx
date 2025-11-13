// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { GiftPage } from "./pages/GiftPage";
import { AdminGiftsPage } from "./pages/AdminGiftsPage";
import { SignInBar } from "./components/SignInBar";
import "../src/pages/gift-page.css"
import "../src/assets/storybox-logo.png"

export default function App() {
  return (
    <>
     <div className="storygift-header">
  {/* Header */}
<div className="gift-header">
  

  {/* REMOVE the title below */}
  {/* <h1 className="gift-main-title">Story Box</h1> */}
</div>
   <div className="storygift-header-right"></div>
  <div className="signin-bar">
    <SignInBar />
  </div>
</div>

      <Routes>
        <Route path="/" element={<Navigate to="/admin/gifts" replace />} />
        <Route path="/gift/:giftId" element={<GiftPage />} />
        <Route path="/admin/gifts" element={<AdminGiftsPage />} />
        <Route path="*" element={<div>Not found</div>} />
      </Routes>
    </>
  );
}