import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Anchor, Globe2, LogOut, MessageCircle, Pencil, Radio, Send, UserPlus, Zap } from "lucide-react";
import "./styles.css";

const translations = {
  en: {
    welcome: "Reconnect. Relive. Chat.",
    choose: "Choose your username",
    placeholder: "YourName",
    enter: "Enter Anchor",
    language: "Language",
    home: "Home",
    profile: "My Profile",
    friends: "Friends",
    online: "Online",
    about: "About",
    edit: "Edit profile",
    message: "Message",
    buzz: "Buzz",
    add: "Add friend",
    empty: "Your conversations will appear here.",
    welcomeBack: "Welcome to Anchor",
    logout: "Log out",
    status: "Available to chat",
    aboutDefault: "Just here to chat."
  },
  tr: {
    welcome: "Yeniden Bağlan. Yeniden Yaşa. Sohbet Et.",
    choose: "Kullanıcı adını oluştur",
    placeholder: "KullanıcıAdın",
    enter: "Anchor'a Gir",
    language: "Dil",
    home: "Ana Sayfa",
    profile: "Profilim",
    friends: "Arkadaşlar",
    online: "Çevrimiçi",
    about: "Hakkında",
    edit: "Profili düzenle",
    message: "Mesaj",
    buzz: "Dürt",
    add: "Arkadaş ekle",
    empty: "Sohbetlerin burada görünecek.",
    welcomeBack: "Anchor'a hoş geldin",
    logout: "Çıkış yap",
    status: "Sohbete hazır",
    aboutDefault: "Sadece sohbet etmek için buradayım."
  },
  de: {
    welcome: "Verbinden. Erinnern. Chatten.",
    choose: "Wähle deinen Benutzernamen",
    placeholder: "DeinName",
    enter: "Anchor betreten",
    language: "Sprache",
    home: "Startseite",
    profile: "Mein Profil",
    friends: "Freunde",
    online: "Online",
    about: "Über mich",
    edit: "Profil bearbeiten",
    message: "Nachricht",
    buzz: "Anstupsen",
    add: "Freund hinzufügen",
    empty: "Deine Unterhaltungen erscheinen hier.",
    welcomeBack: "Willkommen bei Anchor",
    logout: "Abmelden",
    status: "Bereit zum Chatten",
    aboutDefault: "Nur zum Chatten hier."
  }
};

function Logo({ small = false }) {
  return (
    <div className={`brand ${small ? "brand-small" : ""}`}>
      <div className="logo-mark" aria-label="Anchor logo">
        <Anchor size={small ? 22 : 42} strokeWidth={2.3} />
      </div>
      <span>ANCHOR</span>
    </div>
  );
}

function App() {
  const [lang, setLang] = useState(localStorage.getItem("anchor_lang") || "en");
  const [username, setUsername] = useState(localStorage.getItem("anchor_username") || "");
  const [input, setInput] = useState("");
  const [about, setAbout] = useState(localStorage.getItem("anchor_about") || "");
  const [showEdit, setShowEdit] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem("anchor_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const enter = () => {
    const clean = input.trim().replace(/\s+/g, "");
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(clean)) {
      alert("Username must be 3–24 characters and contain only letters, numbers, ., _, or -.");
      return;
    }
    localStorage.setItem("anchor_username", clean);
    setUsername(clean);
    setInput("");
  };

  const saveAbout = () => {
    const value = about.trim().slice(0, 160);
    localStorage.setItem("anchor_about", value);
    setAbout(value);
    setShowEdit(false);
  };

  const logout = () => {
    localStorage.removeItem("anchor_username");
    setUsername("");
  };

  if (!username) {
    return (
      <div className="landing">
        <div className="bubble bubble-one" />
        <div className="bubble bubble-two" />
        <div className="landing-card">
          <Logo />
          <div className="tagline">{t.welcome}</div>
          <p className="intro">
            A new home for old-school conversations, friendships and memories.
          </p>

          <label className="field-label">{t.choose}</label>
          <div className="username-input">
            <span>@</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enter()}
              placeholder={t.placeholder}
              maxLength={24}
              autoFocus
            />
          </div>

          <button className="primary-btn" onClick={enter}>
            <MessageCircle size={18} />
            {t.enter}
          </button>

          <div className="language-row">
            <Globe2 size={15} />
            <span>{t.language}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div className="footer-note">Anchor • 2026</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo small />
        <div className="top-actions">
          <div className="mini-user">
            <div className="avatar avatar-mini">{username[0].toUpperCase()}</div>
            <div>
              <strong>@{username}</strong>
              <small><span className="dot" /> {t.online}</small>
            </div>
          </div>
          <button className="icon-btn" onClick={logout} title={t.logout}><LogOut size={18} /></button>
        </div>
      </header>

      <main className="dashboard">
        <aside className="sidebar">
          <section className="profile-card">
            <div className="avatar avatar-large">{username[0].toUpperCase()}</div>
            <h2>@{username}</h2>
            <div className="status"><span className="dot" /> {t.online}</div>
            <p>{about || t.aboutDefault}</p>
            <button className="secondary-btn" onClick={() => setShowEdit(true)}>
              <Pencil size={15} /> {t.edit}
            </button>
          </section>

          <nav className="nav-list">
            <div className="nav-title">{t.friends}</div>
            <button className="friend active">
              <div className="avatar avatar-small">A</div>
              <div><strong>Anchor</strong><small><span className="dot" /> {t.online}</small></div>
            </button>
            <button className="add-friend"><UserPlus size={16} /> {t.add}</button>
          </nav>

          <div className="sidebar-language">
            <Globe2 size={15} />
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </aside>

        <section className="content">
          <div className="welcome-panel">
            <div className="welcome-icon"><Radio size={28} /></div>
            <h1>{t.welcomeBack}, <span>@{username}</span></h1>
            <p>{t.empty}</p>
            <div className="feature-row">
              <div><Zap size={18} /><strong>{t.buzz}</strong><small>Classic Anchor Buzz</small></div>
              <div><MessageCircle size={18} /><strong>{t.message}</strong><small>Real-time chat</small></div>
            </div>
          </div>
        </section>
      </main>

      {showEdit && (
        <div className="modal-backdrop" onMouseDown={() => setShowEdit(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>{t.edit}</h2>
            <p>@{username}</p>
            <label>{t.about}</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={160}
              placeholder={t.aboutDefault}
              rows={4}
            />
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="primary-btn" onClick={saveAbout}><Send size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
