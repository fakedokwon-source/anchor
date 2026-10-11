import { useCallback, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './admin-panel.css';

export default function AdminPanel({ session, onBack }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('anchor_admin_lang');
      if (saved && ['en', 'tr', 'de'].includes(saved)) return saved;
      // Default to English so the admin interface does not reveal the browser's locale.
      return 'en';
    } catch { return 'en'; }
  });
  const translations = {
    en: {
      checking: 'Checking administrator access…', denied: 'Access denied', restricted: 'This area is available only to authorized ANCHOR administrators.', back: 'Return to ANCHOR', adminPanel: 'Admin Panel', menu: 'Administration menu', overview: 'Overview', users: 'Users', messages: 'Message Review', groupMessages: 'Group Conversations', savedNotes: 'Saved Notes', siteBack: '← Back to site', userManagement: 'User Management', platformStatus: 'Administration and platform status', refresh: '↻ Refresh', loading: 'Loading…', searchUser: 'Search username…', searchMessages: 'Search username or message content…', searchGroups: 'Search group, user, or message…', searchNotes: 'Search username or saved content…', search: 'Search', groupType: 'Group type:', allGroups: 'All groups', public: 'Public', private: 'Private', totalUsers: 'Total users', profiles: 'Profile records', privateMessages: 'Private messages', groupMessagesCount: 'Group messages', groupChats: 'Group conversations', todaysMessages: 'Messages today', createdToday: 'Created today', privacyNote: 'Privacy notice', privacyText: 'Message content and shared attachments are visible only to authorized administrators. Review them only for legitimate moderation purposes. Messages and files are read-only in this version.', user: 'User', email: 'Email address', about: 'About', status: 'Status', userId: 'User ID', noName: 'Unnamed', unknownStatus: 'Status unavailable', date: 'Date', sender: 'Sender', recipient: 'Recipient', message: 'Message', state: 'State', deletedMessage: 'Deleted message', deleted: 'Deleted', read: 'Read', unread: 'Unread', group: 'Group', type: 'Type', conversation: 'Conversation', noUsers: 'No users found.', noMessages: 'No messages found.', noGroupMessages: 'No group messages found for this filter.', noNotes: 'No saved notes found.', noteOwner: 'User', savedContent: 'Saved content', limitNote: 'A maximum of 100 records are shown for safety. This version does not delete or modify messages.', publicGroup: 'Public', privateGroup: 'Private', loadError: 'Could not load data.'
    },
    tr: {
      checking: 'Yönetici yetkisi kontrol ediliyor…', denied: 'Erişim reddedildi', restricted: 'Bu alan yalnızca yetkili ANCHOR yöneticilerine açıktır.', back: "ANCHOR'a dön", adminPanel: 'Yönetim Paneli', menu: 'Yönetim menüsü', overview: 'Genel Bakış', users: 'Kullanıcılar', messages: 'Mesaj İnceleme', groupMessages: 'Grup Konuşmaları', savedNotes: 'Kayıtlı Notlar', siteBack: '← Siteye dön', userManagement: 'Kullanıcı Yönetimi', platformStatus: 'Yönetim işlemleri ve platform durumu', refresh: '↻ Yenile', loading: 'Yükleniyor…', searchUser: 'Kullanıcı adı ara…', searchMessages: 'Kullanıcı adı veya mesaj içeriği ara…', searchGroups: 'Grup, kullanıcı veya mesaj ara…', searchNotes: 'Kullanıcı adı veya kayıtlı içerik ara…', search: 'Ara', groupType: 'Grup türü:', allGroups: 'Tüm gruplar', public: 'Herkese açık', private: 'Gizli', totalUsers: 'Toplam kullanıcı', profiles: 'Profil kayıtları', privateMessages: 'Özel mesajlar', groupMessagesCount: 'Grup mesajları', groupChats: 'Grup sohbetleri', todaysMessages: 'Bugünkü mesajlar', createdToday: 'Bugün oluşturulan', privacyNote: 'Gizlilik notu', privacyText: 'Özel mesaj içerikleri ve paylaşılan dosyalar yalnızca yetkili yöneticiye görünür. Yalnızca gerekli moderasyon amacıyla inceleyin. Mesajlar ve dosyalar salt okunur görüntülenir.', user: 'Kullanıcı', email: 'E-posta adresi', about: 'Hakkında', status: 'Durum', userId: 'Kullanıcı ID', noName: 'İsimsiz', unknownStatus: 'Durum bilinmiyor', date: 'Tarih', sender: 'Gönderen', recipient: 'Alıcı', message: 'Mesaj', state: 'Durum', deletedMessage: 'Silinmiş mesaj', deleted: 'Silinmiş', read: 'Okundu', unread: 'Okunmadı', group: 'Grup', type: 'Tür', conversation: 'Konuşma', noUsers: 'Kullanıcı bulunamadı.', noMessages: 'Mesaj bulunamadı.', noGroupMessages: 'Bu filtrede grup mesajı bulunamadı.', noNotes: 'Kayıtlı not bulunamadı.', noteOwner: 'Kullanıcı', savedContent: 'Kayıtlı içerik', limitNote: 'Güvenlik için en fazla 100 kayıt listelenir. Bu sürüm mesaj silmez veya değiştirmez.', publicGroup: 'Herkese açık', privateGroup: 'Gizli', loadError: 'Veriler yüklenemedi.'
    },
    de: {
      checking: 'Administratorzugriff wird geprüft…', denied: 'Zugriff verweigert', restricted: 'Dieser Bereich ist nur für autorisierte ANCHOR-Administratoren verfügbar.', back: 'Zurück zu ANCHOR', adminPanel: 'Adminbereich', menu: 'Administrationsmenü', overview: 'Übersicht', users: 'Benutzer', messages: 'Nachrichtenprüfung', groupMessages: 'Gruppengespräche', savedNotes: 'Gespeicherte Notizen', siteBack: '← Zurück zur Website', userManagement: 'Benutzerverwaltung', platformStatus: 'Verwaltung und Plattformstatus', refresh: '↻ Aktualisieren', loading: 'Wird geladen…', searchUser: 'Benutzernamen suchen…', searchMessages: 'Benutzername oder Nachricht suchen…', searchGroups: 'Gruppe, Benutzer oder Nachricht suchen…', searchNotes: 'Benutzername oder gespeicherten Inhalt suchen…', search: 'Suchen', groupType: 'Gruppentyp:', allGroups: 'Alle Gruppen', public: 'Öffentlich', private: 'Privat', totalUsers: 'Benutzer insgesamt', profiles: 'Profileinträge', privateMessages: 'Private Nachrichten', groupMessagesCount: 'Gruppennachrichten', groupChats: 'Gruppengespräche', todaysMessages: 'Nachrichten heute', createdToday: 'Heute erstellt', privacyNote: 'Datenschutzhinweis', privacyText: 'Nachrichteninhalte sind nur für autorisierte Administratoren zugänglich. Beschränken Sie den Zugriff und beachten Sie Ihre Organisationsrichtlinien. Nachrichten können in dieser Version nur gelesen werden.', user: 'Benutzer', email: 'E-Mail-Adresse', about: 'Über', status: 'Status', userId: 'Benutzer-ID', noName: 'Ohne Namen', unknownStatus: 'Status nicht verfügbar', date: 'Datum', sender: 'Absender', recipient: 'Empfänger', message: 'Nachricht', state: 'Status', deletedMessage: 'Gelöschte Nachricht', deleted: 'Gelöscht', read: 'Gelesen', unread: 'Ungelesen', group: 'Gruppe', type: 'Typ', conversation: 'Gespräch', noUsers: 'Keine Benutzer gefunden.', noMessages: 'Keine Nachrichten gefunden.', noGroupMessages: 'Keine Gruppennachrichten für diesen Filter gefunden.', noNotes: 'Keine gespeicherten Notizen gefunden.', noteOwner: 'Benutzer', savedContent: 'Gespeicherter Inhalt', limitNote: 'Aus Sicherheitsgründen werden maximal 100 Einträge angezeigt. Diese Version löscht oder ändert keine Nachrichten.', publicGroup: 'Öffentlich', privateGroup: 'Privat', loadError: 'Daten konnten nicht geladen werden.'
    }
  };
  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  useEffect(() => { try { localStorage.setItem('anchor_admin_lang', lang); } catch {} }, [lang]);

  const [authorized, setAuthorized] = useState(null);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [savedNotes, setSavedNotes] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupVisibility, setGroupVisibility] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkAdmin = useCallback(async () => {
    if (!session?.user?.id) { setAuthorized(false); return; }
    const { data, error: rpcError } = await supabase.rpc('anchor_is_admin');
    if (rpcError) { setError(rpcError.message); setAuthorized(false); return; }
    setAuthorized(data === true);
  }, [session?.user?.id]);

  const loadTab = useCallback(async () => {
    if (authorized !== true) return;
    setLoading(true); setError('');
    try {
      if (tab === 'overview') {
        const { data, error: e } = await supabase.rpc('anchor_admin_stats');
        if (e) throw e;
        setStats(data);
      } else if (tab === 'users') {
        const { data, error: e } = await supabase.rpc('anchor_admin_list_users_with_email', { p_search: search });
        if (e) throw e;
        setUsers(Array.isArray(data) ? data : []);
      } else if (tab === 'messages') {
        const { data, error: e } = await supabase.rpc('anchor_admin_list_messages', { p_search: search, p_limit: 100 });
        if (e) throw e;
        const rows = Array.isArray(data) ? data : [];
        setMessages(rows);
        // Attachment metadata is stored as JSON in messages.content. Resolve private
        // Storage paths only after the admin RPC has verified the current admin.
        const attachmentRows = rows.map((m) => {
          if (m.deleted_at || !m.content) return null;
          try {
            const parsed = JSON.parse(m.content);
            return parsed?.anchorAttachment === true && typeof parsed.path === 'string'
              ? { id: m.id, path: parsed.path }
              : null;
          } catch { return null; }
        }).filter(Boolean);
        const resolved = {};
        await Promise.all(attachmentRows.map(async (item) => {
          const { data: signed, error: signedError } = await supabase.storage
            .from('anchor-chat-media').createSignedUrl(item.path, 300);
          if (!signedError && signed?.signedUrl) resolved[item.id] = signed.signedUrl;
          else console.warn('Admin attachment URL error:', item.id, signedError?.message);
        }));
        setAttachmentUrls(resolved);
      } else if (tab === 'saved_notes') {
        const { data, error: e } = await supabase.rpc('anchor_admin_list_saved_notes', { p_search: search, p_limit: 100 });
        if (e) throw e;
        setSavedNotes(Array.isArray(data) ? data : []);
      } else if (tab === 'group_messages') {
        const { data, error: e } = await supabase.rpc('anchor_admin_list_group_messages', { p_search: search, p_visibility: groupVisibility, p_limit: 100 });
        if (e) throw e;
        setGroupMessages(Array.isArray(data) ? data : []);
      }
    } catch (e) { setError(e?.message || t('loadError')); }
    finally { setLoading(false); }
  }, [authorized, tab, search, groupVisibility, lang]);

  useEffect(() => { checkAdmin(); }, [checkAdmin]);
  useEffect(() => { loadTab(); }, [loadTab]);

  if (authorized === null) return <main className="anchor-admin"><header className="admin-header"><div><strong>ANCHOR</strong></div><select aria-label="Language" value={lang} onChange={e => setLang(e.target.value)}><option value="en">English</option><option value="tr">Türkçe</option><option value="de">Deutsch</option></select></header><p>{t('checking')}</p></main>;
  if (!authorized) return <main className="anchor-admin"><section className="admin-denied"><div className="admin-mark">A</div><div className="admin-language"><label>{t('language') || 'Language'} <select aria-label="Language" value={lang} onChange={e => setLang(e.target.value)}><option value="en">English</option><option value="tr">Türkçe</option><option value="de">Deutsch</option></select></label></div><h1>{t('denied')}</h1><p>{t('restricted')}</p>{error && <small>{error}</small>}<button onClick={onBack || (() => { window.location.href = '/'; })}>{t('back')}</button></section></main>;

  const tabTitle = tab === 'overview' ? t('overview') : tab === 'users' ? t('userManagement') : tab === 'messages' ? t('messages') : tab === 'group_messages' ? t('groupMessages') : t('savedNotes');
  return <main className="anchor-admin">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span className="admin-mark">A</span><div><strong>ANCHOR</strong><small>{t('adminPanel')}</small></div></div>
      <nav aria-label={t('menu')}>
        {[["overview",t('overview')],["users",t('users')],["messages",t('messages')],["group_messages",t('groupMessages')],["saved_notes",t('savedNotes')]].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>
      <div className="admin-sidebar-bottom"><label className="admin-language"><span>🌐</span> <select aria-label="Language" value={lang} onChange={e => setLang(e.target.value)}><option value="en">English</option><option value="tr">Türkçe</option><option value="de">Deutsch</option></select></label><span>{t('user')}: {session?.user?.email || session?.user?.id?.slice(0, 8)}</span><button onClick={onBack || (() => { window.location.href = '/'; })}>{t('siteBack')}</button></div>
    </aside>
    <section className="admin-main">
      <header className="admin-header"><div><span className="admin-eyebrow">ANCHOR / ADMIN</span><h1>{tabTitle}</h1><p>{t('platformStatus')}</p></div><button className="admin-refresh" onClick={loadTab} disabled={loading}>{loading ? t('loading') : t('refresh')}</button></header>
      {error && <div className="admin-error">{error}</div>}
      {tab === 'overview' && <div className="admin-stats">
        <article><span>{t('totalUsers')}</span><strong>{stats?.users ?? '—'}</strong><small>{t('profiles')}</small></article>
        <article><span>{t('privateMessages')}</span><strong>{stats?.messages ?? '—'}</strong><small>{t('messages')}</small></article>
        <article><span>{t('groupMessagesCount')}</span><strong>{stats?.groups_messages ?? '—'}</strong><small>{t('groupChats')}</small></article>
        <article><span>{t('todaysMessages')}</span><strong>{stats?.messages_today ?? '—'}</strong><small>{t('createdToday')}</small></article>
        <div className="admin-notice"><strong>{t('privacyNote')}</strong><p>{t('privacyText')}</p></div>
      </div>}
      {(tab === 'users' || tab === 'messages' || tab === 'saved_notes' || tab === 'group_messages') && <>
        <div className="admin-toolbar"><input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'users' ? t('searchUser') : tab === 'messages' ? t('searchMessages') : tab === 'group_messages' ? t('searchGroups') : t('searchNotes')} onKeyDown={e => { if (e.key === 'Enter') loadTab(); }} /><button onClick={loadTab} disabled={loading}>{t('search')}</button></div>
        {tab === 'group_messages' && <div className="admin-toolbar"><label>{t('groupType')} <select value={groupVisibility} onChange={e => setGroupVisibility(e.target.value)}><option value="all">{t('allGroups')}</option><option value="public">{t('public')}</option><option value="private">{t('private')}</option></select></label></div>}
        {tab === 'users' ? (
          <div className="admin-table-wrap"><table><thead><tr><th>{t('user')}</th><th>{t('email')}</th><th>{t('about')}</th><th>{t('status')}</th><th>{t('userId')}</th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td><div className="admin-user">{u.avatar_url ? <img src={u.avatar_url} alt="" /> : <span>{(u.username || '?').slice(0,1).toUpperCase()}</span>}<strong>{u.username || t('noName')}</strong></div></td><td style={{ overflowWrap: 'anywhere' }}>{u.email || '—'}</td><td>{u.about || '—'}</td><td><i className="admin-dot" />{u.status || t('unknownStatus')}</td><td><code>{u.id}</code></td></tr>)}</tbody></table>{!users.length && !loading && <p className="admin-empty">{t('noUsers')}</p>}</div>
        ) : tab === 'messages' ? (
          <div className="admin-table-wrap"><table><thead><tr><th>{t('date')}</th><th>{t('sender')}</th><th>{t('recipient')}</th><th>{t('message')}</th><th>{t('state')}</th></tr></thead><tbody>{messages.map(m => <tr key={m.id}><td>{m.created_at ? new Date(m.created_at).toLocaleString(lang) : '—'}</td><td>{m.sender_username || m.sender_id?.slice(0,8) || '—'}</td><td>{m.receiver_username || m.receiver_id?.slice(0,8) || '—'}</td><td className="admin-message-content">{m.deleted_at ? <em>{t('deletedMessage')}</em> : (() => {
              let attachment = null;
              try { const parsed = JSON.parse(m.content || ''); if (parsed?.anchorAttachment === true) attachment = parsed; } catch {}
              if (!attachment) return <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', margin: 0 }}>{m.content || `[${m.message_type || t('message')}]`}</pre>;
              const url = attachmentUrls[m.id];
              return <div style={{ minWidth: 180, maxWidth: 320, display: 'grid', gap: 6 }}>
                <strong style={{ overflowWrap: 'anywhere' }}>{attachment.name || 'Attachment'}</strong>
                <small>{attachment.mimeType || 'file'} · {Number.isFinite(attachment.size) ? `${(attachment.size / 1024).toFixed(0)} KB` : ''}</small>
                {url ? (String(attachment.mimeType || '').startsWith('image/')
                  ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={attachment.name || 'Shared image'} loading="lazy" style={{ display: 'block', maxWidth: 280, maxHeight: 220, objectFit: 'contain', borderRadius: 8 }} /></a>
                  : <a href={url} target="_blank" rel="noreferrer" download={attachment.name || 'download'}>↧ {lang === 'tr' ? 'Dosyayı aç / indir' : lang === 'de' ? 'Datei öffnen / herunterladen' : 'Open / download file'}</a>)
                  : <small>{lang === 'tr' ? 'Dosya bağlantısı alınamadı. Storage izinlerini kontrol et.' : lang === 'de' ? 'Dateilink nicht verfügbar. Storage-Berechtigungen prüfen.' : 'File link unavailable. Check Storage permissions.'}</small>}
              </div>;
            })()}</td><td><span className="admin-status">{m.deleted_at ? t('deleted') : m.read_at ? t('read') : t('unread')}</span></td></tr>)}</tbody></table>{!messages.length && !loading && <p className="admin-empty">{t('noMessages')}</p>}</div>
        ) : tab === 'group_messages' ? (
          <div className="admin-table-wrap"><table><thead><tr><th>{t('date')}</th><th>{t('group')}</th><th>{t('type')}</th><th>{t('sender')}</th><th>{t('conversation')}</th></tr></thead><tbody>{groupMessages.map(m => <tr key={m.id}><td>{m.created_at ? new Date(m.created_at).toLocaleString(lang) : '—'}</td><td><strong>{m.group_name || t('noName')}</strong><br/><small>@{m.group_username || '—'}</small></td><td><span className="admin-status">{m.is_private ? t('privateGroup') : t('publicGroup')}</span></td><td>{m.sender_username || m.sender_id?.slice(0, 8) || '—'}</td><td className="admin-message-content"><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', margin: 0 }}>{m.content || '—'}</pre></td></tr>)}</tbody></table>{!groupMessages.length && !loading && <p className="admin-empty">{t('noGroupMessages')}</p>}</div>
        ) : (
          <div className="admin-table-wrap"><table><thead><tr><th>{t('date')}</th><th>{t('noteOwner')}</th><th>{t('savedContent')}</th></tr></thead><tbody>{savedNotes.map(note => <tr key={note.id}><td>{note.created_at ? new Date(note.created_at).toLocaleString(lang) : '—'}</td><td>{note.username || note.user_id || '—'}</td><td className="admin-message-content"><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', margin: 0 }}>{note.content || '—'}</pre></td></tr>)}</tbody></table>{!savedNotes.length && !loading && <p className="admin-empty">{t('noNotes')}</p>}</div>
        )}
        <p className="admin-footnote">{t('limitNote')}</p>
      </>}
    </section>
  </main>;
}
