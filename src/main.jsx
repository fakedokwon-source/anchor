import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import { createRoot } from 'react-dom/client';

import {
  Search,
  Send,
  UserPlus,
  Users,
  MessageCircle,
  LogOut,
  Settings,
  X,
  Check,
  UserMinus,
  Volume2,
  Shield,
  ShieldOff,
  Trash2,
  Zap,
  Camera,
  Globe,
  Circle
} from 'lucide-react';

import { supabase } from './lib/supabase';
import './styles.css';


/* =========================================================
   LOGO
========================================================= */

function Logo({ small = false }) {
  return (
    <div className={small ? 'brand-small' : ''}>
      <div className="brand-name">
        ANCHOR
      </div>

      <span className="brand-powered">
        POWERED BY TERRA CLASSIC COMMUNITY
      </span>
    </div>
  );
}


/* =========================================================
   LIVE TERRA CLASSIC PRICE TICKER
========================================================= */
function MarketTicker() {
  const [markets, setMarkets] = useState([
    { symbol: 'LUNC/USDT', id: 'terra-luna', price: null, change: null, loading: true },
    { symbol: 'USTC/USDT', id: 'terrausd', price: null, change: null, loading: true },
    { symbol: 'JURIS/USDT', id: 'juris-protocol', price: null, change: null, loading: true }
  ]);

  useEffect(() => {
    let active = true;
    const targets = [
      { symbol: 'LUNC/USDT', id: 'terra-luna' },
      { symbol: 'USTC/USDT', id: 'terrausd' },
      { symbol: 'JURIS/USDT', id: 'juris-protocol' }
    ];

    const getJson = async (url) => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Price provider returned ${response.status}`);
      return response.json();
    };

    const loadPrices = async () => {
      // Keep the last known prices visible if one provider temporarily fails.
      let next = null;
      try {
        const data = await getJson(
          'https://api.coingecko.com/api/v3/simple/price?ids=terra-luna,terrausd,juris-protocol&vs_currencies=usd&include_24hr_change=true'
        );
        next = targets.map((target) => {
          const coin = data[target.id];
          const price = Number(coin?.usd);
          const change = Number(coin?.usd_24h_change);
          return {
            ...target,
            price: Number.isFinite(price) && price > 0 ? price : null,
            change: Number.isFinite(change) ? change : null,
            loading: false
          };
        });
      } catch (error) {
        console.warn('ANCHOR CoinGecko ticker unavailable; trying fallback providers.', error);
      }

      // Binance provides direct LUNC/USDT and USTC/USDT market prices.
      const fallbackJobs = [
        getJson('https://api.binance.com/api/v3/ticker/24hr?symbol=LUNCUSDT')
          .then((data) => ({ index: 0, price: Number(data.lastPrice), change: Number(data.priceChangePercent) })),
        getJson('https://api.binance.com/api/v3/ticker/24hr?symbol=USTCUSDT')
          .then((data) => ({ index: 1, price: Number(data.lastPrice), change: Number(data.priceChangePercent) })),
        // JURIS/USDT is listed on WEEX. Use its public SPOT ticker first;
        // DexScreener is a secondary fallback (it may not index CEX pairs).
        (async () => {
          try {
            const data = await getJson('https://api-spot.weex.com/api/v3/ticker/24hr?symbol=JURISUSDT');
            const ticker = Array.isArray(data) ? data.find((item) => String(item.symbol || '').toUpperCase() === 'JURISUSDT') : data;
            const price = Number(ticker?.lastPrice);
            const change = Number(ticker?.priceChangePercent ?? ticker?.priceChange);
            if (Number.isFinite(price) && price > 0) {
              return { index: 2, price, change };
            }
            throw new Error('WEEX did not return a valid JURISUSDT spot price');
          } catch (weexError) {
            const data = await getJson('https://api.dexscreener.com/latest/dex/search?q=JURIS');
            const pairs = (data.pairs || []).filter((pair) =>
              String(pair.baseToken?.symbol || '').toUpperCase() === 'JURIS' &&
              String(pair.quoteToken?.symbol || '').toUpperCase() === 'USDT' &&
              Number(pair.priceUsd) > 0
            );
            pairs.sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));
            const pair = pairs[0];
            if (!pair) throw new Error('No valid JURIS/USDT price from WEEX or DexScreener');
            return { index: 2, price: Number(pair.priceUsd), change: Number(pair.priceChange?.h24) };
          }
        })()
      ];

      const fallbackResults = await Promise.allSettled(fallbackJobs);
      if (!next) {
        next = targets.map((target) => ({ ...target, price: null, change: null, loading: false }));
      }
      fallbackResults.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        const { index, price, change } = result.value;
        if (Number.isFinite(price) && price > 0) {
          next[index] = { ...next[index], price, change: Number.isFinite(change) ? change : next[index].change, loading: false };
        }
      });

      if (active) {
        setMarkets((current) => next.map((market, index) => ({
          ...market,
          // If all providers fail for a symbol, preserve its previous valid price.
          price: market.price ?? current[index]?.price ?? null,
          change: market.change ?? current[index]?.change ?? null,
          loading: false
        })));
      }
    };

    loadPrices();
    const timer = window.setInterval(loadPrices, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const formatPrice = (value) => {
    if (value == null || !Number.isFinite(value)) return 'Veri bulunamadı';
    if (value < 0.000001) return '$' + value.toFixed(10);
    if (value < 0.0001) return '$' + value.toFixed(8);
    if (value < 0.01) return '$' + value.toFixed(6);
    if (value < 1) return '$' + value.toFixed(5);
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const cards = markets;
  return (
    <div className="anchor-market-ticker" aria-label="LUNC, USTC ve JURIS fiyatları">
      <style>{`
        .anchor-market-ticker{width:100%;overflow:hidden;position:relative;box-sizing:border-box;background:linear-gradient(90deg,#101a2a,#142235 50%,#101a2a);border-bottom:1px solid rgba(130,160,195,.16);border-top:1px solid rgba(130,160,195,.10);}
        .anchor-market-track{display:flex;width:max-content;animation:anchor-market-scroll 22s linear infinite;}
        .anchor-market-track:hover{animation-play-state:paused;}
        .anchor-market-card{display:flex;align-items:center;gap:10px;padding:11px 24px;min-width:190px;border-right:1px solid rgba(130,160,195,.15);white-space:nowrap;}
        .anchor-market-symbol{color:#e7edf7;font-size:12px;font-weight:800;letter-spacing:.35px;}
        .anchor-market-price{color:#f8fafc;font-size:13px;font-weight:700;}
        .anchor-market-change{font-size:11px;font-weight:800;}
        .anchor-market-change.up{color:#36d399;}.anchor-market-change.down{color:#fb7185;}.anchor-market-change.neutral{color:#9caec4;}
        .anchor-market-dot{width:7px;height:7px;flex:0 0 7px;border-radius:50%;background:#36d399;box-shadow:0 0 8px rgba(54,211,153,.45);}
        @keyframes anchor-market-scroll{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}
        @media(prefers-reduced-motion:reduce){.anchor-market-track{animation:none;}}
      `}</style>
      <div className="anchor-market-track">
        {cards.map((market, index) => (
          <div className="anchor-market-card" key={`${market.symbol}-${index}`}>
            <span className="anchor-market-dot" />
            <span className="anchor-market-symbol">{market.symbol}</span>
            <span className="anchor-market-price">{market.loading ? 'Yükleniyor…' : formatPrice(market.price)}</span>
            {!market.loading && market.change != null && (
              <span className={`anchor-market-change ${market.change > 0 ? 'up' : market.change < 0 ? 'down' : 'neutral'}`}>
                {market.change > 0 ? '+' : ''}{market.change.toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return null;
    }

    audioContext = new AudioContext();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}


function playMessageSound() {
  try {
    const ctx = getAudioContext();

    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';

    oscillator.frequency.setValueAtTime(
      660,
      ctx.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      880,
      ctx.currentTime + 0.12
    );

    gain.gain.setValueAtTime(
      0.0001,
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.08,
      ctx.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + 0.16
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();

    oscillator.stop(
      ctx.currentTime + 0.18
    );
  } catch (error) {
    console.error(
      'Message sound error:',
      error
    );
  }
}


function playBuzzSound() {
  try {
    const ctx = getAudioContext();

    if (!ctx) return;

    const frequencies = [
      330,
      620,
      420,
      720
    ];

    frequencies.forEach(
      (frequency, index) => {
        const oscillator =
          ctx.createOscillator();

        const gain =
          ctx.createGain();

        oscillator.type = 'square';

        const start =
          ctx.currentTime +
          index * 0.08;

        oscillator.frequency.setValueAtTime(
          frequency,
          start
        );

        gain.gain.setValueAtTime(
          0.0001,
          start
        );

        gain.gain.exponentialRampToValueAtTime(
          0.06,
          start + 0.015
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + 0.07
        );

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(start);

        oscillator.stop(
          start + 0.08
        );
      }
    );
  } catch (error) {
    console.error(
      'Buzz sound error:',
      error
    );
  }
}


/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {
  en: {
    welcome: 'Welcome to Anchor',
    choose: 'Choose your language',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    placeholder: 'Username',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Password',
    enter: 'Enter',
    login: 'Login',
    have: 'Already have an account?',
    new: 'New here?',
    switchLogin: 'Login',
    switchSignup: 'Create account',
    language: 'Language',
    profile: 'Profile',
    friends: 'Friends',
    online: 'Online',
    offline: 'Offline',
    about: 'About',
    edit: 'Edit profile',
    photo: 'Profile photo',
    message: 'Message',
    buzz: 'Buzz',
    add: 'Add friend',
    empty: 'No results',
    welcomeBack: 'Welcome back',
    logout: 'Logout',
    aboutDefault: 'No information yet.',
    save: 'Save',
    cancel: 'Cancel',
    created: 'Account created successfully.',
    invalidUser: 'Please enter a username.',
    invalidEmail: 'Please enter a valid email.',
    shortPass: 'Password must be at least 6 characters.',
    generic: 'Something went wrong.',
    checking: 'Checking...',
    search: 'Search',
    searchPlaceholder: 'Search users...',
    searchUsers: 'Search users',
    noUsers: 'No users found.',
    requestSent: 'Request sent',
    pending: 'Pending',
    accept: 'Accept',
    reject: 'Reject',
    requests: 'Friend requests',
    myFriends: 'My friends',
    noFriends: 'You have no friends yet.',
    chatTitle: 'Conversation',
    sendMessage: 'Send message',
    typeMessage: 'Type a message...',
    noMessages: 'No messages yet.',
    you: 'You',
    deleteMessage: 'Delete message',
    deleteConfirm: 'Delete this message?',
    deletedMessage: 'Message deleted',
    block: 'Block',
    unblock: 'Unblock',
    blockConfirm: 'Block this user?',
    unblockConfirm: 'Unblock this user?',
    blocked: 'Blocked',
    unblocked: 'Unblocked',
    blockedMessage: 'You blocked this user.',
    blockedByUser: 'This user has blocked you.',
    cannotMessageBlocked: 'You cannot message this user.',
    buzzSent: 'Buzz sent',
    buzzReceived: 'Buzz!',
    close: 'Close',
    onlineNow: 'Online',
    offlineNow: 'Offline',
    justNow: 'Just now'
  },

  tr: {
    welcome: 'Anchor’a Hoş Geldin',
    choose: 'Dilini seç',
    username: 'Kullanıcı adı',
    email: 'E-posta',
    password: 'Şifre',
    placeholder: 'Kullanıcı adı',
    emailPlaceholder: 'sen@ornek.com',
    passwordPlaceholder: 'Şifre',
    enter: 'Giriş yap',
    login: 'Giriş yap',
    have: 'Zaten hesabın var mı?',
    new: 'Yeni misin?',
    switchLogin: 'Giriş yap',
    switchSignup: 'Hesap oluştur',
    language: 'Dil',
    profile: 'Profil',
    friends: 'Arkadaşlar',
    online: 'Çevrimiçi',
    offline: 'Çevrimdışı',
    about: 'Hakkında',
    edit: 'Profili düzenle',
    photo: 'Profil fotoğrafı',
    message: 'Mesaj',
    buzz: 'Buzz',
    add: 'Arkadaş ekle',
    empty: 'Sonuç yok',
    welcomeBack: 'Tekrar hoş geldin',
    logout: 'Çıkış yap',
    aboutDefault: 'Henüz bilgi yok.',
    save: 'Kaydet',
    cancel: 'İptal',
    created: 'Hesap başarıyla oluşturuldu.',
    invalidUser: 'Lütfen kullanıcı adı gir.',
    invalidEmail: 'Lütfen geçerli bir e-posta gir.',
    shortPass: 'Şifre en az 6 karakter olmalı.',
    generic: 'Bir şeyler ters gitti.',
    checking: 'Kontrol ediliyor...',
    search: 'Ara',
    searchPlaceholder: 'Kullanıcı ara...',
    searchUsers: 'Kullanıcı ara',
    noUsers: 'Kullanıcı bulunamadı.',
    requestSent: 'İstek gönderildi',
    pending: 'Bekliyor',
    accept: 'Kabul et',
    reject: 'Reddet',
    requests: 'Arkadaşlık istekleri',
    myFriends: 'Arkadaşlarım',
    noFriends: 'Henüz arkadaşın yok.',
    chatTitle: 'Sohbet',
    sendMessage: 'Mesaj gönder',
    typeMessage: 'Mesaj yaz...',
    noMessages: 'Henüz mesaj yok.',
    you: 'Sen',
    deleteMessage: 'Mesajı sil',
    deleteConfirm: 'Bu mesaj silinsin mi?',
    deletedMessage: 'Mesaj silindi',
    block: 'Engelle',
    unblock: 'Engeli kaldır',
    blockConfirm: 'Bu kullanıcı engellensin mi?',
    unblockConfirm: 'Bu kullanıcının engeli kaldırılsın mı?',
    blocked: 'Engellendi',
    unblocked: 'Engel kaldırıldı',
    blockedMessage: 'Bu kullanıcıyı engelledin.',
    blockedByUser: 'Bu kullanıcı seni engelledi.',
    cannotMessageBlocked: 'Bu kullanıcıya mesaj gönderemezsin.',
    buzzSent: 'Buzz gönderildi',
    buzzReceived: 'Buzz!',
    close: 'Kapat',
    onlineNow: 'Çevrimiçi',
    offlineNow: 'Çevrimdışı',
    justNow: 'Az önce'
  },

  de: {
    welcome: 'Willkommen bei Anchor',
    choose: 'Wähle deine Sprache',
    username: 'Benutzername',
    email: 'E-Mail',
    password: 'Passwort',
    placeholder: 'Benutzername',
    emailPlaceholder: 'du@beispiel.com',
    passwordPlaceholder: 'Passwort',
    enter: 'Eintreten',
    login: 'Anmelden',
    have: 'Du hast bereits ein Konto?',
    new: 'Neu hier?',
    switchLogin: 'Anmelden',
    switchSignup: 'Konto erstellen',
    language: 'Sprache',
    profile: 'Profil',
    friends: 'Freunde',
    online: 'Online',
    offline: 'Offline',
    about: 'Über mich',
    edit: 'Profil bearbeiten',
    photo: 'Profilfoto',
    message: 'Nachricht',
    buzz: 'Buzz',
    add: 'Freund hinzufügen',
    empty: 'Keine Ergebnisse',
    welcomeBack: 'Willkommen zurück',
    logout: 'Abmelden',
    aboutDefault: 'Noch keine Informationen.',
    save: 'Speichern',
    cancel: 'Abbrechen',
    created: 'Konto erfolgreich erstellt.',
    invalidUser: 'Bitte Benutzernamen eingeben.',
    invalidEmail: 'Bitte gültige E-Mail eingeben.',
    shortPass: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    generic: 'Etwas ist schiefgelaufen.',
    checking: 'Überprüfung...',
    search: 'Suchen',
    searchPlaceholder: 'Benutzer suchen...',
    searchUsers: 'Benutzer suchen',
    noUsers: 'Keine Benutzer gefunden.',
    requestSent: 'Anfrage gesendet',
    pending: 'Ausstehend',
    accept: 'Akzeptieren',
    reject: 'Ablehnen',
    requests: 'Freundschaftsanfragen',
    myFriends: 'Meine Freunde',
    noFriends: 'Du hast noch keine Freunde.',
    chatTitle: 'Unterhaltung',
    sendMessage: 'Nachricht senden',
    typeMessage: 'Nachricht schreiben...',
    noMessages: 'Noch keine Nachrichten.',
    you: 'Du',
    deleteMessage: 'Nachricht löschen',
    deleteConfirm: 'Diese Nachricht löschen?',
    deletedMessage: 'Nachricht gelöscht',
    block: 'Blockieren',
    unblock: 'Entsperren',
    blockConfirm: 'Diesen Benutzer blockieren?',
    unblockConfirm: 'Blockierung aufheben?',
    blocked: 'Blockiert',
    unblocked: 'Blockierung aufgehoben',
    blockedMessage: 'Du hast diesen Benutzer blockiert.',
    blockedByUser: 'Dieser Benutzer hat dich blockiert.',
    cannotMessageBlocked: 'Du kannst diesem Benutzer nicht schreiben.',
    buzzSent: 'Buzz gesendet',
    buzzReceived: 'Buzz!',
    close: 'Schließen',
    onlineNow: 'Online',
    offlineNow: 'Offline',
    justNow: 'Gerade eben'
  }
};


/* =========================================================
   AUTH
========================================================= */

function Auth({
  language,
  setLanguage,
  onAuth
}) {
  const t = translations[language];

  const [mode, setMode] =
    useState('login');

  const [username, setUsername] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');


  const submit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (mode === 'signup') {
      if (!username.trim()) {
        setError(t.invalidUser);
        return;
      }
    }

    if (!email.trim()) {
      setError(t.invalidEmail);
      return;
    }

    if (password.length < 6) {
      setError(t.shortPass);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const {
          data,
          error: loginError
        } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (loginError) {
          throw loginError;
        }

        if (data?.user) {
          onAuth(data.user);
        }
      } else {
        const {
          data,
          error: signupError
        } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: username.trim()
            }
          }
        });

        if (signupError) {
          throw signupError;
        }

        if (data?.user) {
          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              username: username.trim(),
              about: ''
            });

          if (data.session) {
            onAuth(data.user);
          } else {
            setSuccess(
              `${t.created} Check your email if confirmation is enabled.`
            );

            setMode('login');
          }
        }
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
        t.generic
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-brand">
          <Logo />
        </div>

        <div className="auth-title">
          <h1>
            {mode === 'login'
              ? t.welcomeBack
              : t.welcome}
          </h1>

          <p>
            {t.choose}
          </p>
        </div>


        <div className="language-row">

          {['en', 'tr', 'de'].map(
            (item) => (
              <button
                key={item}
                type="button"
                className={
                  language === item
                    ? 'language-button active'
                    : 'language-button'
                }
                onClick={() =>
                  setLanguage(item)
                }
              >
                {item.toUpperCase()}
              </button>
            )
          )}

        </div>


        <form
          className="auth-form"
          onSubmit={submit}
        >

          {mode === 'signup' && (
            <label>
              <span>
                {t.username}
              </span>

              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder={t.placeholder}
                autoComplete="username"
              />
            </label>
          )}


          <label>
            <span>
              {t.email}
            </span>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder={t.emailPlaceholder}
              autoComplete="email"
            />
          </label>


          <label>
            <span>
              {t.password}
            </span>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder={t.passwordPlaceholder}
              autoComplete={
                mode === 'login'
                  ? 'current-password'
                  : 'new-password'
              }
            />
          </label>


          {error && (
            <div className="form-error">
              {error}
            </div>
          )}


          {success && (
            <div className="form-success">
              {success}
            </div>
          )}


          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? t.checking
              : mode === 'login'
                ? t.login
                : t.switchSignup}
          </button>

        </form>


        <div className="auth-switch">

          {mode === 'login' ? (
            <>
              <span>
                {t.new}
              </span>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setSuccess('');
                }}
              >
                {t.switchSignup}
              </button>
            </>
          ) : (
            <>
              <span>
                {t.have}
              </span>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
              >
                {t.switchLogin}
              </button>
            </>
          )}

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   APP
========================================================= */

function App({
  session
}) {
  const [language, setLanguage] =
    useState(
      localStorage.getItem(
        'anchor-language'
      ) || 'en'
    );

  const t = translations[language];


  const [profile, setProfile] =
    useState(null);

  const [friends, setFriends] =
    useState([]);

  const [friendRequests, setFriendRequests] =
    useState([]);

  const [unreadCounts, setUnreadCounts] =
    useState({});

  const [blockedUsers, setBlockedUsers] =
    useState([]);

  const [selectedFriend, setSelectedFriend] =
    useState(null);

  /*
    Realtime mesaj handler'i useEffect içinde çalıştığı için
    seçili sohbeti her zaman güncel tutuyoruz.
  */
  const selectedFriendRef = useRef(null);

  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  const [messages, setMessages] =
    useState([]);

  const [messageText, setMessageText] =
    useState('');

  const [searchText, setSearchText] =
    useState('');

  const [searchResults, setSearchResults] =
    useState([]);

  const [searching, setSearching] =
    useState(false);

  const [profileModal, setProfileModal] =
    useState(false);

  const [viewedFriendProfile, setViewedFriendProfile] =
    useState(null);

  const [viewFriendProfileModal, setViewFriendProfileModal] =
    useState(false);

  const [loadingFriendProfile, setLoadingFriendProfile] =
    useState(false);

  const [editUsername, setEditUsername] =
    useState('');

  const [editAbout, setEditAbout] =
    useState('');

  const [editAvatar, setEditAvatar] =
    useState('');

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [buzzAnimation, setBuzzAnimation] =
    useState(false);

  const [toast, setToast] =
    useState('');

  const messagesEndRef =
    useRef(null);

  const buzzTimerRef =
    useRef(null);


  /* =======================================================
     HELPERS
  ======================================================= */

  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast('');
    }, 2200);
  };


  const isBlocked = (userId) => {
    return blockedUsers.includes(userId);
  };


  const triggerBuzz = () => {
    playBuzzSound();

    setBuzzAnimation(true);

    if (buzzTimerRef.current) {
      clearTimeout(
        buzzTimerRef.current
      );
    }

    buzzTimerRef.current =
      window.setTimeout(() => {
        setBuzzAnimation(false);
      }, 700);
  };


  /* =======================================================
     LANGUAGE
  ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      'anchor-language',
      language
    );
  }, [language]);


  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const loadProfile = async (userId) => {
    const {
      data,
      error
    } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(
        'Profile load error:',
        error
      );
      return;
    }

    if (data) {
      setProfile(data);

      setEditUsername(
        data.username || ''
      );

      setEditAbout(
        data.about || ''
      );

      setEditAvatar(
        data.avatar_url || ''
      );
    }
  };


  /* =======================================================
     ONLINE STATUS
  ======================================================= */

  const broadcastPresence = async (
    userId,
    isOnline,
    lastSeen = new Date().toISOString()
  ) => {
    const channel =
      presenceChannelRef.current;

    if (!channel) {
      return;
    }

    try {
      const result =
        await channel.send({
          type: 'broadcast',
          event: 'presence',
          payload: {
            user_id: userId,
            is_online: isOnline,
            last_seen: lastSeen
          }
        });

      console.log(
        'ANCHOR PRESENCE SENT:',
        {
          userId,
          isOnline,
          result
        }
      );
    } catch (error) {
      console.error(
        'Presence broadcast error:',
        error
      );
    }
  };


  const updateOnlineStatus = async (
    userId,
    isOnline
  ) => {
    const lastSeen =
      new Date().toISOString();

    try {
      const { error } =
        await supabase
          .from('profiles')
          .update({
            is_online: isOnline,
            last_seen: lastSeen
          })
          .eq('id', userId);

      if (error) {
        console.error(
          'Status update error:',
          error
        );
      }
    } catch (error) {
      console.error(
        'Status update error:',
        error
      );
    }

    await broadcastPresence(
      userId,
      isOnline,
      lastSeen
    );
  };


  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const userId =
      session.user.id;

    loadProfile(userId);

    updateOnlineStatus(
      userId,
      true
    );

    const heartbeat =
      window.setInterval(() => {
        updateOnlineStatus(
          userId,
          true
        );
      }, 30000);

    const handlePageHide = () => {
      updateOnlineStatus(
        userId,
        false
      );
    };

    window.addEventListener(
      'pagehide',
      handlePageHide
    );

    return () => {
      clearInterval(heartbeat);

      window.removeEventListener(
        'pagehide',
        handlePageHide
      );

      updateOnlineStatus(
        userId,
        false
      );
    };
  }, [session?.user?.id]);


  /* =======================================================
     LOAD FRIEND REQUESTS
  ======================================================= */

  const loadFriendRequests = async (
    userId
  ) => {
    const {
      data,
      error
    } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', {
        ascending: false
      });

    if (error) {
      console.error(
        'Friend requests error:',
        error
      );
      return;
    }

    setFriendRequests(
      data || []
    );
  };


  /* =======================================================
     LOAD FRIENDS
  ======================================================= */

  const loadFriends = async (
    userId
  ) => {
    const {
      data,
      error
    } = await supabase
      .from('friendships')
      .select(
        'id, user_id, friend_id'
      )
      .or(
        `user_id.eq.${userId},friend_id.eq.${userId}`
      );

    if (error) {
      console.error(
        'Friends error:',
        error
      );
      return;
    }

    const friendIds =
      (data || []).map(
        (friendship) =>
          friendship.user_id === userId
            ? friendship.friend_id
            : friendship.user_id
      );

    if (!friendIds.length) {
      setFriends([]);
      return;
    }

    const {
      data: profiles,
      error: profilesError
    } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds);

    if (profilesError) {
      console.error(
        'Friend profiles error:',
        profilesError
      );
      return;
    }

    setFriends(
      profiles || []
    );
  };


  /* =======================================================
     LOAD UNREAD
  ======================================================= */

  const loadUnreadCounts = async (
    userId
  ) => {
    const {
      data,
      error
    } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', userId)
      .is('read_at', null)
      .is('deleted_at', null);

    if (error) {
      console.error(
        'Unread error:',
        error
      );
      return;
    }

    const counts = {};

    (data || []).forEach(
      (item) => {
        counts[item.sender_id] =
          (counts[item.sender_id] || 0) + 1;
      }
    );

    setUnreadCounts(counts);
  };


  /* =======================================================
     LOAD BLOCKS
  ======================================================= */

  const loadBlocks = async (
    userId
  ) => {
    const {
      data,
      error
    } = await supabase
      .from('blocked_users')
      .select(
        'id, blocker_id, blocked_id'
      )
      .eq('blocker_id', userId);

    if (error) {
      console.error(
        'Blocked users error:',
        error
      );
      return;
    }

    setBlockedUsers(
      (data || []).map(
        (item) =>
          item.blocked_id
      )
    );
  };


  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const userId =
      session.user.id;

    loadFriendRequests(userId);
    loadFriends(userId);
    loadUnreadCounts(userId);
    loadBlocks(userId);
  }, [session?.user?.id]);


  /* =======================================================
     UNREAD MESSAGE POLLING
  ======================================================= */

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const userId = session.user.id;

    /*
      Broadcast mesajı kaçırılırsa bile okunmamış sayaç
      veritabanındaki gerçek read_at durumundan güncellenir.
      Böylece sohbet penceresi AÇIK DEĞİLKEN arkadaşın
      yanında 1, 2, 10... şeklinde gerçek sayı görünür.
    */
    const refreshUnread = () => {
      loadUnreadCounts(userId);
    };

    refreshUnread();

    const unreadTimer = window.setInterval(
      refreshUnread,
      1000
    );

    return () => {
      window.clearInterval(unreadTimer);
    };
  }, [session?.user?.id]);


  /* =======================================================
     REALTIME
  ======================================================= */

  const presenceChannelRef = useRef(null);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const userId =
      session.user.id;

    /*
      Mesajlar: Supabase Broadcast kullanıyoruz.
      Her kullanıcı kendi kanalını dinler.
    */
    const messageChannel =
      supabase
        .channel(
          `anchor-user-${userId}`
        )
        .on(
          'broadcast',
          {
            event: 'message'
          },
          async (payload) => {
            console.log(
              'ANCHOR BROADCAST MESSAGE:',
              payload
            );

            const newMessage =
              payload?.payload;

            if (!newMessage) {
              return;
            }

            if (
              newMessage.receiver_id !== userId
            ) {
              return;
            }

            const activeFriendId =
              selectedFriendRef.current?.id || null;

            const isActiveConversation =
              activeFriendId === newMessage.sender_id;

            /*
              Mesaj sadece o kişiyle açık olan sohbetse
              ekranda aktif konuşmaya eklenir.
              Başka bir arkadaşın sohbetindeysek mesajı
              mevcut sohbete karıştırmıyoruz.
            */
            if (isActiveConversation) {
              setMessages(
                (current) => {
                  const exists =
                    current.some(
                      (message) =>
                        message.id ===
                        newMessage.id
                    );

                  if (exists) {
                    return current;
                  }

                  return [
                    ...current,
                    newMessage
                  ];
                }
              );
            }

            playMessageSound();

            if (isActiveConversation) {
              /*
                Sohbet zaten açıksa mesajı hemen okundu
                olarak işaretle ve bildirim sayısını sıfırla.
              */
              const {
                error: readError
              } = await supabase
                .from('messages')
                .update({
                  read_at:
                    new Date().toISOString()
                })
                .eq(
                  'id',
                  newMessage.id
                )
                .eq(
                  'receiver_id',
                  userId
                );

              if (readError) {
                console.error(
                  'Incoming message read error:',
                  readError
                );
              }

              setUnreadCounts(
                (current) => ({
                  ...current,
                  [newMessage.sender_id]: 0
                })
              );
            } else {
              /*
                Sohbet açık değilse sol taraftaki arkadaş
                listesinde anlık okunmamış mesaj sayısını artır.
              */
              setUnreadCounts(
                (current) => ({
                  ...current,
                  [newMessage.sender_id]:
                    (current[newMessage.sender_id] || 0) + 1
                })
              );

              console.log(
                'ANCHOR UNREAD COUNT UPDATED:',
                {
                  senderId: newMessage.sender_id,
                  count:
                    (unreadCounts[newMessage.sender_id] || 0) + 1
                }
              );
            }
          }
        )
        .subscribe(
          (status) => {
            console.log(
              'ANCHOR BROADCAST STATUS:',
              status
            );

            if (
              status ===
              'SUBSCRIBED'
            ) {
              console.log(
                'ANCHOR BROADCAST CONNECTED'
              );
            }

            if (
              status ===
              'CHANNEL_ERROR'
            ) {
              console.error(
                'ANCHOR BROADCAST CHANNEL ERROR'
              );
            }

            if (
              status ===
              'TIMED_OUT'
            ) {
              console.error(
                'ANCHOR BROADCAST TIMED OUT'
              );
            }
          }
        );

    /*
      Çevrimiçi / çevrimdışı durumları için ayrı
      Broadcast kanalı kullanıyoruz.
      Böylece profiles UPDATE postgres_changes'e
      bağlı kalmadan durum anında karşı tarafa gider.
    */
    const presenceChannel =
      supabase
        .channel('anchor-presence')
        .on(
          'broadcast',
          {
            event: 'presence'
          },
          (payload) => {
            const presence =
              payload?.payload;

            if (
              !presence?.user_id ||
              presence.user_id === userId
            ) {
              return;
            }

            const isOnline =
              Boolean(presence.is_online);

            console.log(
              'ANCHOR PRESENCE UPDATE:',
              presence
            );

            setFriends(
              (current) =>
                current.map(
                  (friend) =>
                    friend.id ===
                    presence.user_id
                      ? {
                          ...friend,
                          is_online: isOnline,
                          last_seen:
                            presence.last_seen ||
                            friend.last_seen
                        }
                      : friend
                )
            );

            setSelectedFriend(
              (current) => {
                if (
                  !current ||
                  current.id !==
                    presence.user_id
                ) {
                  return current;
                }

                return {
                  ...current,
                  is_online: isOnline,
                  last_seen:
                    presence.last_seen ||
                    current.last_seen
                };
              }
            );

            setSearchResults(
              (current) =>
                current.map(
                  (user) =>
                    user.id ===
                    presence.user_id
                      ? {
                          ...user,
                          is_online: isOnline,
                          last_seen:
                            presence.last_seen ||
                            user.last_seen
                        }
                      : user
                )
            );
          }
        )
        .subscribe((status) => {
          console.log(
            'ANCHOR PRESENCE STATUS:',
            status
          );

          if (status === 'SUBSCRIBED') {
            console.log(
              'ANCHOR PRESENCE CONNECTED'
            );
          }
        });

    presenceChannelRef.current =
      presenceChannel;

    /*
      Buzz sistemi mevcut postgres_changes ile
      çalışmaya devam ediyor.
    */
    const handleIncomingBuzz =
      (payload) => {
        console.log(
          'ANCHOR REALTIME BUZZ:',
          payload
        );

        const newBuzz =
          payload?.new;

        if (!newBuzz) {
          return;
        }

        if (
          newBuzz.receiver_id === userId &&
          newBuzz.sender_id !== userId
        ) {
          triggerBuzz();
        }
      };

    const realtimeChannel =
      supabase
        .channel(
          `anchor-realtime-${userId}`
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'buzz_events'
          },
          handleIncomingBuzz
        )
        .subscribe(
          (status) => {
            console.log(
              'ANCHOR REALTIME STATUS:',
              status
            );

            if (
              status ===
              'SUBSCRIBED'
            ) {
              console.log(
                'ANCHOR REALTIME CONNECTED'
              );
            }

            if (
              status ===
              'CHANNEL_ERROR'
            ) {
              console.error(
                'ANCHOR REALTIME CHANNEL ERROR'
              );
            }

            if (
              status ===
              'TIMED_OUT'
            ) {
              console.error(
                'ANCHOR REALTIME TIMED OUT'
              );
            }
          }
        );

    return () => {
      console.log(
        'ANCHOR REALTIME DISCONNECTED'
      );

      if (
        presenceChannelRef.current ===
        presenceChannel
      ) {
        presenceChannelRef.current =
          null;
      }

      supabase.removeChannel(
        messageChannel
      );

      supabase.removeChannel(
        presenceChannel
      );

      supabase.removeChannel(
        realtimeChannel
      );
    };

  }, [session?.user?.id]);


  /* =======================================================
     LOAD MESSAGES
  ======================================================= */

  const loadMessages = async (
    friend
  ) => {

    if (!session?.user?.id) {
      return;
    }

    setLoadingMessages(true);

    const userId =
      session.user.id;


    const {
      data,
      error
    } = await supabase
      .from('messages')
      .select(
        `
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read_at,
          message_type,
          deleted_at
        `
      )
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${userId})`
      )
      .order(
        'created_at',
        {
          ascending: true
        }
      );


    if (error) {

      console.error(
        'Messages load error:',
        error
      );

      setMessages([]);

      setLoadingMessages(false);

      return;
    }


    setMessages(
      data || []
    );


    await markMessagesAsRead(
      friend.id
    );


    setUnreadCounts(
      (current) => ({
        ...current,
        [friend.id]: 0
      })
    );


    setLoadingMessages(false);
  };


  /* =======================================================
     SELECT FRIEND
  ======================================================= */

  const selectFriend = async (
    friend
  ) => {

    setSelectedFriend(
      friend
    );

    setMessageText('');

    await loadMessages(
      friend
    );
  };


  /* =======================================================
     MARK READ
  ======================================================= */

  const markMessagesAsRead =
    async (friendId) => {

      if (!session?.user?.id) {
        return;
      }

      const {
        error
      } = await supabase
        .from('messages')
        .update({
          read_at:
            new Date().toISOString()
        })
        .eq(
          'receiver_id',
          session.user.id
        )
        .eq(
          'sender_id',
          friendId
        )
        .is(
          'read_at',
          null
        );

      if (error) {
        console.error(
          'Mark messages as read error:',
          error
        );
      }
    };


  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });

  }, [messages]);


  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const sendMessage =
    async (event) => {

      event?.preventDefault();

      if (!session?.user?.id) {
        return;
      }

      if (!selectedFriend?.id) {
        return;
      }

      const content =
        messageText.trim();

      if (!content) {
        return;
      }

      if (
        isBlocked(
          selectedFriend.id
        )
      ) {
        showToast(
          t.cannotMessageBlocked
        );
        return;
      }

      /*
        Önce mesajı veritabanına kaydet.
        Böylece mesaj kalıcı olur.
      */
      const {
        data,
        error
      } = await supabase
        .from('messages')
        .insert({
          sender_id:
            session.user.id,
          receiver_id:
            selectedFriend.id,
          content,
          message_type:
            'message'
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error(
          'Send message error:',
          error
        );

        showToast(
          error.message ||
          t.generic
        );

        return;
      }

      if (!data) {
        console.error(
          'Message insert returned no data.'
        );

        showToast(
          t.generic
        );

        return;
      }

      /*
        Gönderenin kendi ekranında
        mesajı hemen göster.
      */
      setMessages(
        (current) => {
          const exists =
            current.some(
              (message) =>
                message.id ===
                data.id
            );

          if (exists) {
            return current;
          }

          return [
            ...current,
            data
          ];
        }
      );

      /*
        Alıcının kişisel Broadcast
        kanalına mesajı gönder.
      */
      const receiverChannel =
        supabase.channel(
          `anchor-user-${selectedFriend.id}`
        );

      receiverChannel.subscribe(
        async (status) => {
          console.log(
            'ANCHOR MESSAGE DELIVERY STATUS:',
            status
          );

          if (
            status !==
            'SUBSCRIBED'
          ) {
            return;
          }

          try {
            const result =
              await receiverChannel.send({
                type: 'broadcast',
                event: 'message',
                payload: data
              });

            console.log(
              'ANCHOR MESSAGE BROADCAST SENT:',
              result
            );
          } catch (broadcastError) {
            console.error(
              'ANCHOR BROADCAST SEND ERROR:',
              broadcastError
            );
          }

          window.setTimeout(() => {
            supabase.removeChannel(
              receiverChannel
            );
          }, 1000);
        }
      );

      setMessageText('');
    };


  /* =======================================================
     SEND BUZZ
  ======================================================= */

  const sendBuzz =
    async () => {

      if (!session?.user?.id) {
        return;
      }

      if (!selectedFriend?.id) {
        return;
      }


      if (
        isBlocked(
          selectedFriend.id
        )
      ) {

        showToast(
          t.cannotMessageBlocked
        );

        return;
      }


      const {
        error
      } = await supabase
        .from('buzz_events')
        .insert({
          sender_id:
            session.user.id,
          receiver_id:
            selectedFriend.id
        });


      if (error) {

        console.error(
          'Buzz error:',
          error
        );

        showToast(
          error.message ||
          t.generic
        );

        return;
      }


      triggerBuzz();

      showToast(
        t.buzzSent
      );
    };


  /* =======================================================
     DELETE MESSAGE
  ======================================================= */

  const deleteMessage =
    async (messageId) => {

      if (!session?.user?.id) {
        return;
      }


      const confirmed =
        window.confirm(
          t.deleteConfirm
        );

      if (!confirmed) {
        return;
      }


      const {
        error
      } = await supabase
        .from('messages')
        .update({
          deleted_at:
            new Date().toISOString(),
          content: ''
        })
        .eq(
          'id',
          messageId
        )
        .eq(
          'sender_id',
          session.user.id
        );


      if (error) {

        console.error(
          'Delete message error:',
          error
        );

        showToast(
          error.message ||
          t.generic
        );

        return;
      }


      setMessages(
        (current) =>
          current.map(
            (message) =>
              message.id ===
              messageId
                ? {
                    ...message,
                    deleted_at:
                      new Date().toISOString(),
                    content: ''
                  }
                : message
          )
      );
    };


  /* =======================================================
     BLOCK USER
  ======================================================= */

  const blockUser =
    async (userId) => {

      if (!session?.user?.id) {
        return;
      }


      const confirmed =
        window.confirm(
          t.blockConfirm
        );

      if (!confirmed) {
        return;
      }


      const {
        error
      } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id:
            session.user.id,
          blocked_id:
            userId
        });


      if (
        error &&
        error.code !== '23505'
      ) {

        console.error(
          'Block error:',
          error
        );

        showToast(
          error.message ||
          t.generic
        );

        return;
      }


      setBlockedUsers(
        (current) =>
          current.includes(userId)
            ? current
            : [
                ...current,
                userId
              ]
      );


      showToast(
        t.blocked
      );
    };


  /* =======================================================
     UNBLOCK USER
  ======================================================= */

  const unblockUser =
    async (userId) => {

      if (!session?.user?.id) {
        return;
      }


      const confirmed =
        window.confirm(
          t.unblockConfirm
        );

      if (!confirmed) {
        return;
      }


      const {
        error
      } = await supabase
        .from('blocked_users')
        .delete()
        .eq(
          'blocker_id',
          session.user.id
        )
        .eq(
          'blocked_id',
          userId
        );


      if (error) {

        console.error(
          'Unblock error:',
          error
        );

        showToast(
          error.message ||
          t.generic
        );

        return;
      }


      setBlockedUsers(
        (current) =>
          current.filter(
            (id) =>
              id !== userId
          )
      );


      showToast(
        t.unblocked
      );
    };


  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  const saveProfile =
    async () => {

      if (!session?.user?.id) {
        return;
      }


      const username =
        editUsername.trim();

      if (!username) {

        showToast(
          t.invalidUser
        );

        return;
      }


      setSavingProfile(true);


      const {
        error
      } = await supabase
        .from('profiles')
        .update({
          username,
          about:
            editAbout.trim(),
          avatar_url:
            editAvatar || null
        })
        .eq(
          'id',
          session.user.id
        );


      if (error) {

        console.error(
          'Profile save error:',
          error
        );

        showToast(
          error.message ||
          t.generic
        );

        setSavingProfile(false);

        return;
      }


      await loadProfile(session.user.id);


      setProfileModal(false);

      setSavingProfile(false);
    };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout =
    async () => {

      if (session?.user?.id) {

        await updateOnlineStatus(
          session.user.id,
          false
        );

      }

      await supabase.auth.signOut();
    };


  /* =======================================================
     AVATAR
  ======================================================= */

  const handleAvatarChange =
    (event) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          'image/'
        )
      ) {
        return;
      }


      const reader =
        new FileReader();


      reader.onload = () => {

        setEditAvatar(
          reader.result
        );

      };


      reader.readAsDataURL(
        file
      );
    };


  /* =======================================================
     SEARCH USERS
  ======================================================= */

  const searchUsers =
    async () => {

      const query =
        searchText.trim();

      if (!query) {

        setSearchResults([]);

        return;
      }


      setSearching(true);


      const {
        data,
        error
      } = await supabase
        .from('profiles')
        .select('*')
        .ilike(
          'username',
          `%${query}%`
        )
        .neq(
          'id',
          session.user.id
        )
        .limit(20);


      if (error) {

        console.error(
          'Search error:',
          error
        );

        setSearchResults([]);

        setSearching(false);

        return;
      }


      setSearchResults(
        data || []
      );

      setSearching(false);
    };


  useEffect(() => {

    const timer =
      window.setTimeout(() => {

        searchUsers();

      }, 350);

    return () => {

      clearTimeout(timer);

    };

  }, [searchText]);


  /* =======================================================
     SEND FRIEND REQUEST
  ======================================================= */

  const sendFriendRequest =
    async (receiverId) => {

      if (!session?.user?.id) {
        return;
      }


      const {
        data: existing
      } = await supabase
        .from('friend_requests')
        .select(
          'id,status'
        )
        .or(
          `and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`
        );


      if (
        existing?.some(
          (request) =>
            request.status ===
            'accepted'
        )
      ) {

        showToast(
          t.myFriends
        );

        return;
      }


      if (
        existing?.some(
          (request) =>
            request.status ===
            'pending'
        )
      ) {

        showToast(
          t.pending
        );

        return;
      }


      const {
        error
      } = await supabase
        .from('friend_requests')
        .insert({
          sender_id:
            session.user.id,
          receiver_id:
            receiverId,
          status:
            'pending'
        });


      if (error) {

        console.error(
          'Friend request error:',
          error
        );

        showToast(
          error.message ||
          t.generic
        );

        return;
      }


      showToast(
        t.requestSent
      );
    };


  /* =======================================================
     ACCEPT REQUEST
  ======================================================= */

  const acceptRequest =
    async (request) => {

      if (!session?.user?.id) {
        return;
      }


      const {
        error: updateError
      } = await supabase
        .from('friend_requests')
        .update({
          status:
            'accepted'
        })
        .eq(
          'id',
          request.id
        )
        .eq(
          'receiver_id',
          session.user.id
        );


      if (updateError) {

        console.error(
          'Accept request error:',
          updateError
        );

        showToast(
          updateError.message ||
          t.generic
        );

        return;
      }


      const friendshipRows = [
        {
          user_id:
            session.user.id,
          friend_id:
            request.sender_id
        },
        {
          user_id:
            request.sender_id,
          friend_id:
            session.user.id
        }
      ];


      const {
        error:
          friendshipError
      } = await supabase
        .from('friendships')
        .upsert(
          friendshipRows,
          {
            onConflict:
              'user_id,friend_id'
          }
        );


      if (friendshipError) {

        console.error(
          'Friendship error:',
          friendshipError
        );

        showToast(
          friendshipError.message ||
          t.generic
        );

        return;
      }


      await loadFriendRequests(
        session.user.id
      );

      await loadFriends(
        session.user.id
      );
    };


  /* =======================================================
     REJECT REQUEST
  ======================================================= */

  const rejectRequest =
    async (request) => {

      if (!session?.user?.id) {
        return;
      }


      const {
        error
      } = await supabase
        .from('friend_requests')
        .update({
          status:
            'rejected'
        })
        .eq(
          'id',
          request.id
        )
        .eq(
          'receiver_id',
          session.user.id
        );


      if (error) {

        console.error(
          'Reject request error:',
          error
        );

        showToast(
          error.message ||
          t.generic
        );

        return;
      }


      await loadFriendRequests(
        session.user.id
      );
    };


  /* =======================================================
     VIEW A FRIEND'S PROFILE (READ-ONLY)
  ======================================================= */

  const openFriendProfile = async (friend) => {
    if (!friend?.id) return;

    // Show the information already loaded in the friend list immediately.
    setViewedFriendProfile(friend);
    setViewFriendProfileModal(true);
    setLoadingFriendProfile(true);

    // Refresh from profiles so the latest avatar/about text is shown.
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, about, avatar_url, is_online, created_at')
      .eq('id', friend.id)
      .maybeSingle();

    if (error) {
      console.error('Friend profile load error:', error);
      // Keep the profile data already available rather than closing the modal.
    } else if (data) {
      setViewedFriendProfile((current) =>
        current?.id === friend.id ? { ...current, ...data } : current
      );
    }

    setLoadingFriendProfile(false);
  };


  /* =======================================================
     OPEN PROFILE MODAL
  ======================================================= */

  const openProfileModal =
    () => {

      setEditUsername(
        profile?.username || ''
      );

      setEditAbout(
        profile?.about || ''
      );

      setEditAvatar(
        profile?.avatar_url || ''
      );

      setProfileModal(true);
    };


  /* =======================================================
     FORMAT TIME
  ======================================================= */

  const formatTime =
    (dateString) => {

      if (!dateString) {
        return '';
      }

      return new Date(
        dateString
      ).toLocaleTimeString(
        [],
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      );
    };


  /* =======================================================
     AVATAR COMPONENT
  ======================================================= */

  const Avatar = ({
    user,
    size = 44
  }) => {

    const style = {
      width: size,
      height: size,
      minWidth: size,
      borderRadius: '50%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background:
        'linear-gradient(135deg,#dfe8f2,#cbd7e4)',
      color: '#243447',
      fontWeight: 800,
      fontSize:
        Math.max(
          12,
          size * 0.38
        )
    };


    if (
      user?.avatar_url
    ) {

      return (
        <img
          src={user.avatar_url}
          alt={
            user.username ||
            'User'
          }
          style={{
            ...style,
            objectFit: 'cover'
          }}
        />
      );
    }


    return (
      <div style={style}>
        {(
          user?.username ||
          '?'
        )
          .charAt(0)
          .toUpperCase()}
      </div>
    );
  };


  /* =======================================================
     MESSAGE ITEM
  ======================================================= */

  const MessageItem =
    ({ message }) => {

      const mine =
        message.sender_id ===
        session.user.id;

      const deleted =
        Boolean(
          message.deleted_at
        );


      return (
        <div
          className={
            mine
              ? 'message-row mine'
              : 'message-row'
          }
        >

          <div
            className={
              mine
                ? 'message-bubble message-mine'
                : 'message-bubble message-other'
            }
          >

            {deleted ? (
              <div className="deleted-message">

                <em>
                  {t.deletedMessage}
                </em>

              </div>
            ) : (
              <div className="message-content">
                {message.content}
              </div>
            )}


            <div className="message-meta">

              <span>
                {formatTime(
                  message.created_at
                )}
              </span>


              {mine &&
                !deleted && (
                  <span
                    className={
                      message.read_at
                        ? 'read-status read'
                        : 'read-status'
                    }
                  >
                    {message.read_at
                      ? '✓✓'
                      : '✓'}
                  </span>
                )}

            </div>


            {mine &&
              !deleted && (
                <button
                  type="button"
                  className="message-delete-button"
                  title={
                    t.deleteMessage
                  }
                  onClick={() =>
                    deleteMessage(
                      message.id
                    )
                  }
                >
                  <Trash2
                    size={13}
                  />
                </button>
              )}

          </div>

        </div>
      );
    };


  /* =======================================================
     FRIEND LIST ITEM
  ======================================================= */

  const FriendItem =
    ({ friend }) => {

      const selected =
        selectedFriend?.id ===
        friend.id;

      const unread =
        unreadCounts[
          friend.id
        ] || 0;


      return (
        <button
          type="button"
          className={
            selected
              ? 'friend-item selected'
              : unread > 0
                ? 'friend-item unread'
                : 'friend-item'
          }
          onClick={() =>
            selectFriend(friend)
          }
        >

          <div className="friend-avatar-wrap">

            <Avatar
              user={friend}
              size={44}
            />

            <span
              className={
                friend.is_online
                  ? 'online-dot online'
                  : 'online-dot'
              }
            />

          </div>


          <div className="friend-info">

            <strong>
              {friend.username}
            </strong>

            <small>
              {friend.is_online
                ? t.onlineNow
                : t.offlineNow}
            </small>

          </div>


          {unread > 0 && (
            <span
              className="unread-badge"
              style={{
                marginLeft: 'auto',
                minWidth: '22px',
                height: '22px',
                padding: '0 7px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                lineHeight: 1,
                flexShrink: 0,
                boxSizing: 'border-box',
                zIndex: 10
              }}
            >
              {unread > 99
                ? '99+'
                : unread}
            </span>
          )}

        </button>
      );
    };


  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="app-shell">


      {/* ===================================================
          TOP BAR
      =================================================== */}

      <header className="topbar">

        <Logo small />


        <div className="topbar-right">

          <button
            type="button"
            className="top-profile-button"
            onClick={openProfileModal}
          >

            <Avatar
              user={profile}
              size={38}
            />

            <div>

              <strong>
                {profile?.username ||
                  session.user.email}
              </strong>

              <small>
                {profile?.is_online
                  ? t.onlineNow
                  : t.offlineNow}
              </small>

            </div>

          </button>


          <button
            type="button"
            className="icon-button"
            onClick={openProfileModal}
            title={t.profile}
          >
            <Settings
              size={19}
            />
          </button>


          <button
            type="button"
            className="icon-button"
            onClick={logout}
            title={t.logout}
          >
            <LogOut
              size={19}
            />
          </button>

        </div>

      </header>

      <MarketTicker />

      {/* ===================================================
          DASHBOARD
      =================================================== */}

      <main className="dashboard">


        {/* ===============================================
            SIDEBAR
        =============================================== */}

        <aside className="sidebar">


          <div className="sidebar-profile">

            <Avatar
              user={profile}
              size={64}
            />

            <div>

              <strong>
                {profile?.username ||
                  session.user.email}
              </strong>

              <small>
                {profile?.about ||
                  t.aboutDefault}
              </small>

            </div>

          </div>


          {/* SEARCH */}

          <div className="search-box">

            <Search
              size={17}
            />

            <input
              value={searchText}
              onChange={(e) =>
                setSearchText(
                  e.target.value
                )
              }
              placeholder={
                t.searchPlaceholder
              }
            />

            {searchText && (
              <button
                type="button"
                onClick={() =>
                  setSearchText('')
                }
              >
                <X size={15} />
              </button>
            )}

          </div>


          {/* SEARCH RESULTS */}

          {searchText && (
            <div className="search-results">

              <div className="section-title">

                <Search
                  size={15}
                />

                {t.searchUsers}

              </div>


              {searching ? (
                <div className="empty-small">
                  {t.checking}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="empty-small">
                  {t.noUsers}
                </div>
              ) : (
                searchResults.map(
                  (user) => (
                    <div
                      className="search-user-item"
                      key={user.id}
                    >

                      <Avatar
                        user={user}
                        size={38}
                      />

                      <div className="search-user-info">

                        <strong>
                          {user.username}
                        </strong>

                        <small>
                          {user.is_online
                            ? t.onlineNow
                            : t.offlineNow}
                        </small>

                      </div>


                      <button
                        type="button"
                        className="small-action-button"
                        onClick={() =>
                          sendFriendRequest(
                            user.id
                          )
                        }
                      >
                        <UserPlus
                          size={15}
                        />
                      </button>

                    </div>
                  )
                )
              )}

            </div>
          )}


          {/* FRIEND REQUESTS */}

          {friendRequests.length > 0 && (
            <div className="sidebar-section">

              <div className="section-title">

                <UserPlus
                  size={15}
                />

                {t.requests}

                <span className="section-count">
                  {friendRequests.length}
                </span>

              </div>


              <div className="request-list">

                {friendRequests.map(
                  (request) => (
                    <div
                      className="request-item"
                      key={request.id}
                    >

                      <div className="request-user">

                        <span className="request-avatar">
                          ?
                        </span>

                        <div>

                          <strong>
                            {request.sender_id.slice(
                              0,
                              8
                            )}
                          </strong>

                          <small>
                            {t.pending}
                          </small>

                        </div>

                      </div>


                      <div className="request-actions">

                        <button
                          type="button"
                          className="accept-button"
                          onClick={() =>
                            acceptRequest(
                              request
                            )
                          }
                          title={
                            t.accept
                          }
                        >
                          <Check
                            size={15}
                          />
                        </button>


                        <button
                          type="button"
                          className="reject-button"
                          onClick={() =>
                            rejectRequest(
                              request
                            )
                          }
                          title={
                            t.reject
                          }
                        >
                          <X
                            size={15}
                          />
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>
          )}


          {/* FRIENDS */}

          <div className="sidebar-section friends-section">

            <div className="section-title">

              <Users
                size={15}
              />

              {t.myFriends}

              <span className="section-count">
                {friends.length}
              </span>

            </div>


            {friends.length === 0 ? (
              <div className="empty-friends">

                <Users
                  size={28}
                />

                <p>
                  {t.noFriends}
                </p>

              </div>
            ) : (
              <div className="friends-list">

                {friends.map(
                  (friend) => (
                    <FriendItem
                      key={friend.id}
                      friend={friend}
                    />
                  )
                )}

              </div>
            )}

          </div>


          {/* LANGUAGE */}

          <div className="sidebar-bottom">

            <div className="language-label">

              <Globe
                size={15}
              />

              {t.language}

            </div>


            <div className="language-switcher">

              {['en', 'tr', 'de'].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      language === item
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setLanguage(item)
                    }
                  >
                    {item.toUpperCase()}
                  </button>
                )
              )}

            </div>

          </div>

        </aside>


        {/* ===============================================
            CONTENT
        =============================================== */}

        <section className="content">


          {!selectedFriend ? (

            <div className="welcome-panel">

              <div className="welcome-icon">

                <MessageCircle
                  size={40}
                />

              </div>

              <h2>
                {t.welcomeBack}
              </h2>

              <p>
                Select a friend to start
                a conversation.
              </p>

              <div className="welcome-brand">
                <Logo />
              </div>

            </div>

          ) : (

            <div
              className={
                buzzAnimation
                  ? 'chat-window buzz-active'
                  : 'chat-window'
              }
            >


              {/* CHAT HEADER */}

              <div className="chat-header">

                <div
                  className="chat-user"
                  role="button"
                  tabIndex={0}
                  title={language === 'tr' ? 'Arkadaşın profilini görüntüle' : language === 'de' ? 'Profil ansehen' : 'View profile'}
                  onClick={() => openFriendProfile(selectedFriend)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openFriendProfile(selectedFriend);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >

                  <div className="chat-avatar-wrap">

                    <Avatar
                      user={selectedFriend}
                      size={48}
                    />

                    <span
                      className={
                        selectedFriend.is_online
                          ? 'online-dot online'
                          : 'online-dot'
                      }
                    />

                  </div>


                  <div>

                    <strong>
                      {selectedFriend.username}
                    </strong>

                    <small>

                      <Circle
                        size={7}
                        fill={
                          selectedFriend.is_online
                            ? '#22c55e'
                            : '#9ca3af'
                        }
                        stroke="none"
                      />

                      {selectedFriend.is_online
                        ? t.onlineNow
                        : t.offlineNow}

                    </small>

                  </div>

                </div>


                <div className="chat-actions">

                  <button
                    type="button"
                    className={
                      isBlocked(
                        selectedFriend.id
                      )
                        ? 'chat-action-button blocked'
                        : 'chat-action-button'
                    }
                    onClick={() =>
                      isBlocked(
                        selectedFriend.id
                      )
                        ? unblockUser(
                            selectedFriend.id
                          )
                        : blockUser(
                            selectedFriend.id
                          )
                    }
                    title={
                      isBlocked(
                        selectedFriend.id
                      )
                        ? t.unblock
                        : t.block
                    }
                  >

                    {isBlocked(
                      selectedFriend.id
                    ) ? (
                      <ShieldOff
                        size={17}
                      />
                    ) : (
                      <Shield
                        size={17}
                      />
                    )}

                  </button>


                  <button
                    type="button"
                    className="chat-action-button close-chat"
                    onClick={() =>
                      setSelectedFriend(null)
                    }
                    title={t.close}
                  >
                    <X
                      size={18}
                    />
                  </button>

                </div>

              </div>


              {/* BLOCK NOTICE */}

              {isBlocked(
                selectedFriend.id
              ) && (
                <div className="blocked-notice">

                  <Shield
                    size={16}
                  />

                  <span>
                    {t.blockedMessage}
                  </span>

                </div>
              )}


              {/* BUZZ EFFECT */}

              {buzzAnimation && (
                <div className="buzz-overlay">

                  <div className="buzz-effect">

                    <Zap
                      size={42}
                      fill="currentColor"
                    />

                    <span>
                      {t.buzzReceived}
                    </span>

                  </div>

                </div>
              )}


              {/* MESSAGES */}

              <div className="messages-area">

                {loadingMessages ? (
                  <div className="messages-empty">

                    <div className="loading-spinner" />

                    <span>
                      {t.checking}
                    </span>

                  </div>
                ) : messages.length === 0 ? (
                  <div className="messages-empty">

                    <MessageCircle
                      size={32}
                    />

                    <span>
                      {t.noMessages}
                    </span>

                  </div>
                ) : (
                  messages.map(
                    (message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                      />
                    )
                  )
                )}

                <div
                  ref={messagesEndRef}
                />

              </div>


              {/* INPUT */}

              <form
                className="chat-input-area"
                onSubmit={sendMessage}
              >

                <button
                  type="button"
                  className="buzz-button"
                  onClick={sendBuzz}
                  disabled={isBlocked(
                    selectedFriend.id
                  )}
                  title={t.buzz}
                >
                  <Zap
                    size={18}
                    fill="currentColor"
                  />
                </button>


                <input
                  value={messageText}
                  onChange={(e) =>
                    setMessageText(
                      e.target.value
                    )
                  }
                  placeholder={
                    isBlocked(
                      selectedFriend.id
                    )
                      ? t.cannotMessageBlocked
                      : t.typeMessage
                  }
                  disabled={isBlocked(
                    selectedFriend.id
                  )}
                />


                <button
                  type="submit"
                  className="send-message-btn"
                  disabled={
                    !messageText.trim() ||
                    isBlocked(
                      selectedFriend.id
                    )
                  }
                  title={
                    t.sendMessage
                  }
                >
                  <Send
                    size={18}
                  />
                </button>

              </form>

            </div>
          )}

        </section>

      </main>


      {/* ===================================================
          FRIEND PROFILE VIEW MODAL (READ-ONLY)
      =================================================== */}

      {viewFriendProfileModal && viewedFriendProfile && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setViewFriendProfileModal(false);
            }
          }}
        >
          <div className="profile-modal" role="dialog" aria-modal="true" aria-label={language === 'tr' ? 'Arkadaş profili' : language === 'de' ? 'Freundesprofil' : 'Friend profile'}>
            <div className="modal-header">
              <div>
                <h3>{language === 'tr' ? 'Profil' : language === 'de' ? 'Profil' : 'Profile'}</h3>
                <p>{language === 'tr' ? 'Arkadaş bilgileri' : language === 'de' ? 'Profilinformationen' : 'Friend information'}</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewFriendProfileModal(false)}
                aria-label={language === 'tr' ? 'Kapat' : language === 'de' ? 'Schließen' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="profile-edit-body">
              <div className="profile-photo-editor">
                <div className="profile-photo-preview">
                  {viewedFriendProfile.avatar_url ? (
                    <img src={viewedFriendProfile.avatar_url} alt={viewedFriendProfile.username || 'Profile'} />
                  ) : (
                    <span>{(viewedFriendProfile.username || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="modal-field">
                <span>{language === 'tr' ? 'Kullanıcı adı' : language === 'de' ? 'Benutzername' : 'Username'}</span>
                <strong>{viewedFriendProfile.username || '—'}</strong>
              </div>

              <div className="modal-field">
                <span>{language === 'tr' ? 'Hakkında' : language === 'de' ? 'Über mich' : 'About'}</span>
                <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '8px 0 0', color: 'var(--text-primary, #e5edf7)' }}>
                  {viewedFriendProfile.about || (language === 'tr' ? 'Henüz bilgi eklenmemiş.' : language === 'de' ? 'Noch keine Informationen.' : 'No information added yet.')}
                </p>
              </div>

              <div className="profile-email">
                <span>{language === 'tr' ? 'Durum' : language === 'de' ? 'Status' : 'Status'}</span>
                <strong>{viewedFriendProfile.is_online ? (language === 'tr' ? 'Çevrimiçi' : language === 'de' ? 'Online' : 'Online') : (language === 'tr' ? 'Çevrimdışı' : language === 'de' ? 'Offline' : 'Offline')}</strong>
              </div>

              {loadingFriendProfile && (
                <p style={{ fontSize: '12px', opacity: 0.7 }}>{language === 'tr' ? 'Profil güncelleniyor…' : language === 'de' ? 'Profil wird aktualisiert…' : 'Refreshing profile…'}</p>
              )}

              <div className="modal-actions">
                <button type="button" className="primary-button" onClick={() => setViewFriendProfileModal(false)}>
                  {language === 'tr' ? 'Kapat' : language === 'de' ? 'Schließen' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ===================================================
          PROFILE MODAL
      =================================================== */}

      {profileModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              setProfileModal(false);
            }

          }}
        >

          <div className="profile-modal">

            <div className="modal-header">

              <div>

                <h3>
                  {t.edit}
                </h3>

                <p>
                  {t.profile}
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setProfileModal(false)
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>


            <div className="profile-edit-body">


              <div className="profile-photo-editor">

                <div className="profile-photo-preview">

                  {editAvatar ? (
                    <img
                      src={editAvatar}
                      alt={
                        profile?.username ||
                        'Profile'
                      }
                    />
                  ) : (
                    <span>
                      {(
                        editUsername ||
                        '?'
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}

                </div>


                <label className="photo-upload-button">

                  <Camera
                    size={16}
                  />

                  {t.photo}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleAvatarChange
                    }
                    hidden
                  />

                </label>

              </div>


              <label className="modal-field">

                <span>
                  {t.username}
                </span>

                <input
                  value={editUsername}
                  onChange={(e) =>
                    setEditUsername(
                      e.target.value
                    )
                  }
                  maxLength={32}
                />

              </label>


              <label className="modal-field">

                <span>
                  {t.about}
                </span>

                <textarea
                  value={editAbout}
                  onChange={(e) =>
                    setEditAbout(
                      e.target.value
                    )
                  }
                  rows={4}
                  maxLength={200}
                  placeholder={
                    t.aboutDefault
                  }
                />

              </label>


              <div className="profile-email">

                <span>
                  {t.email}
                </span>

                <strong>
                  {session.user.email}
                </strong>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setProfileModal(false)
                  }
                >
                  {t.cancel}
                </button>


                <button
                  type="button"
                  className="primary-button"
                  onClick={saveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile
                    ? t.checking
                    : t.save}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}


      {/* ===================================================
          TOAST
      =================================================== */}

      {toast && (
        <div className="anchor-toast">

          <Check
            size={16}
          />

          <span>
            {toast}
          </span>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   ROOT
========================================================= */

function Root() {
  const [session, setSession] =
    useState(undefined);


  useEffect(() => {

    let mounted = true;


    supabase.auth
      .getSession()
      .then(
        ({
          data
        }) => {

          if (!mounted) {
            return;
          }

          setSession(
            data.session
          );

        }
      );


    const {
      data:
        authListener
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {

          if (!mounted) {
            return;
          }

          setSession(
            newSession
          );

        }
      );


    return () => {

      mounted = false;

      authListener
        ?.subscription
        ?.unsubscribe();

    };

  }, []);


  const [language, setLanguage] =
    useState(
      localStorage.getItem(
        'anchor-language'
      ) || 'en'
    );


  if (session === undefined) {

    return (
      <div className="loading-page">
        <Logo />
      </div>
    );

  }


  if (!session) {

    return (
      <Auth
        language={language}
        setLanguage={setLanguage}
        onAuth={() => {}}
      />
    );

  }


  return (
    <App
      session={session}
    />
  );
}


/* =========================================================
   RENDER
========================================================= */

createRoot(
  document.getElementById('root')
).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);