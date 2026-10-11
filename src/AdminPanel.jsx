import { useCallback, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './admin-panel.css';

export default function AdminPanel({ session, onBack }) {
  const [authorized, setAuthorized] = useState(null);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
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
        const { data, error: e } = await supabase.rpc('anchor_admin_list_users', { p_search: search });
        if (e) throw e;
        setUsers(Array.isArray(data) ? data : []);
      } else if (tab === 'messages') {
        const { data, error: e } = await supabase.rpc('anchor_admin_list_messages', { p_search: search, p_limit: 100 });
        if (e) throw e;
        setMessages(Array.isArray(data) ? data : []);
      } else if (tab === 'saved_notes') {
        const { data, error: e } = await supabase.rpc('anchor_admin_list_saved_notes', { p_search: search, p_limit: 100 });
        if (e) throw e;
        setSavedNotes(Array.isArray(data) ? data : []);
      } else if (tab === 'group_messages') {
        const { data, error: e } = await supabase.rpc('anchor_admin_list_group_messages', { p_search: search, p_visibility: groupVisibility, p_limit: 100 });
        if (e) throw e;
        setGroupMessages(Array.isArray(data) ? data : []);
      }
    } catch (e) { setError(e?.message || 'Veriler yüklenemedi.'); }
    finally { setLoading(false); }
  }, [authorized, tab, search, groupVisibility]);

  useEffect(() => { checkAdmin(); }, [checkAdmin]);
  useEffect(() => { loadTab(); }, [loadTab]);

  if (authorized === null) return <main className="anchor-admin"><p>Yönetici yetkisi kontrol ediliyor…</p></main>;
  if (!authorized) return <main className="anchor-admin"><section className="admin-denied"><div className="admin-mark">A</div><h1>Erişim reddedildi</h1><p>Bu alan yalnızca yetkili ANCHOR yöneticilerine açıktır.</p>{error && <small>{error}</small>}<button onClick={onBack || (() => { window.location.href = '/'; })}>ANCHOR'a dön</button></section></main>;

  return <main className="anchor-admin">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span className="admin-mark">A</span><div><strong>ANCHOR</strong><small>Yönetim Paneli</small></div></div>
      <nav aria-label="Yönetim menüsü">
        {[['overview','Genel Bakış'],['users','Kullanıcılar'],['messages','Mesaj İnceleme'],['group_messages','Grup Konuşmaları'],['saved_notes','Kayıtlı Notlar']].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>
      <div className="admin-sidebar-bottom"><span>Oturum: {session?.user?.email || session?.user?.id?.slice(0, 8)}</span><button onClick={onBack || (() => { window.location.href = '/'; })}>← Siteye dön</button></div>
    </aside>
    <section className="admin-main">
      <header className="admin-header"><div><span className="admin-eyebrow">ANCHOR / ADMIN</span><h1>{tab === 'overview' ? 'Genel Bakış' : tab === 'users' ? 'Kullanıcı Yönetimi' : tab === 'messages' ? 'Mesaj İnceleme' : tab === 'group_messages' ? 'Grup Konuşmaları' : 'Kayıtlı Notlar'}</h1><p>Yönetim işlemleri ve platform durumu</p></div><button className="admin-refresh" onClick={loadTab} disabled={loading}>{loading ? 'Yükleniyor…' : '↻ Yenile'}</button></header>
      {error && <div className="admin-error">{error}</div>}
      {tab === 'overview' && <div className="admin-stats">
        <article><span>Toplam kullanıcı</span><strong>{stats?.users ?? '—'}</strong><small>Profil kayıtları</small></article>
        <article><span>Özel mesajlar</span><strong>{stats?.messages ?? '—'}</strong><small>Mesaj kayıtları</small></article>
        <article><span>Grup mesajları</span><strong>{stats?.groups_messages ?? '—'}</strong><small>Grup sohbetleri</small></article>
        <article><span>Bugünkü mesajlar</span><strong>{stats?.messages_today ?? '—'}</strong><small>Bugün oluşturulan</small></article>
        <div className="admin-notice"><strong>Gizlilik notu</strong><p>Özel mesaj içeriğine yalnızca yetkili yönetici erişebilir. İnceleme erişimini sınırlayın ve işlemleri kurum politikanıza göre kayıt altına alın. Bu ilk sürümde mesajlar salt okunur görüntülenir.</p></div>
      </div>}
      {(tab === 'users' || tab === 'messages' || tab === 'saved_notes' || tab === 'group_messages') && <>
        <div className="admin-toolbar"><input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'users' ? 'Kullanıcı adı ara…' : tab === 'messages' ? 'Kullanıcı adı veya mesaj içeriği ara…' : tab === 'group_messages' ? 'Grup, kullanıcı veya mesaj ara…' : 'Kullanıcı adı veya kayıtlı içerik ara…'} onKeyDown={e => { if (e.key === 'Enter') loadTab(); }} /><button onClick={loadTab} disabled={loading}>Ara</button></div>
        {tab === 'group_messages' && <div className="admin-toolbar"><label>Grup türü: <select value={groupVisibility} onChange={e => setGroupVisibility(e.target.value)}><option value="all">Tüm gruplar</option><option value="public">Herkese açık</option><option value="private">Gizli</option></select></label></div>}
        {tab === 'users' ? (
          <div className="admin-table-wrap"><table><thead><tr><th>Kullanıcı</th><th>Hakkında</th><th>Durum</th><th>Kullanıcı ID</th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td><div className="admin-user">{u.avatar_url ? <img src={u.avatar_url} alt="" /> : <span>{(u.username || '?').slice(0,1).toUpperCase()}</span>}<strong>{u.username || 'İsimsiz'}</strong></div></td><td>{u.about || '—'}</td><td><i className="admin-dot" />{u.status || 'Durum bilinmiyor'}</td><td><code>{u.id}</code></td></tr>)}</tbody></table>{!users.length && !loading && <p className="admin-empty">Kullanıcı bulunamadı.</p>}</div>
        ) : tab === 'messages' ? (
          <div className="admin-table-wrap"><table><thead><tr><th>Tarih</th><th>Gönderen</th><th>Alıcı</th><th>Mesaj</th><th>Durum</th></tr></thead><tbody>{messages.map(m => <tr key={m.id}><td>{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</td><td>{m.sender_username || m.sender_id?.slice(0,8) || '—'}</td><td>{m.receiver_username || m.receiver_id?.slice(0,8) || '—'}</td><td className="admin-message-content">{m.deleted_at ? <em>Silinmiş mesaj</em> : (m.content || `[${m.message_type || 'mesaj'}]`)}</td><td><span className="admin-status">{m.deleted_at ? 'Silinmiş' : m.read_at ? 'Okundu' : 'Okunmadı'}</span></td></tr>)}</tbody></table>{!messages.length && !loading && <p className="admin-empty">Mesaj bulunamadı.</p>}</div>
        ) : tab === 'group_messages' ? (
          <div className="admin-table-wrap"><table><thead><tr><th>Tarih</th><th>Grup</th><th>Tür</th><th>Gönderen</th><th>Konuşma</th></tr></thead><tbody>{groupMessages.map(m => <tr key={m.id}><td>{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</td><td><strong>{m.group_name || 'İsimsiz grup'}</strong><br/><small>@{m.group_username || '—'}</small></td><td><span className="admin-status">{m.is_private ? 'Gizli' : 'Herkese açık'}</span></td><td>{m.sender_username || m.sender_id?.slice(0, 8) || '—'}</td><td className="admin-message-content"><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', margin: 0 }}>{m.content || '—'}</pre></td></tr>)}</tbody></table>{!groupMessages.length && !loading && <p className="admin-empty">Bu filtrede grup mesajı bulunamadı.</p>}</div>
        ) : (
          <div className="admin-table-wrap"><table><thead><tr><th>Tarih</th><th>Kullanıcı</th><th>Kayıtlı içerik</th></tr></thead><tbody>{savedNotes.map(note => <tr key={note.id}><td>{note.created_at ? new Date(note.created_at).toLocaleString() : '—'}</td><td>{note.username || note.user_id || '—'}</td><td className="admin-message-content"><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', margin: 0 }}>{note.content || '—'}</pre></td></tr>)}</tbody></table>{!savedNotes.length && !loading && <p className="admin-empty">Kayıtlı not bulunamadı.</p>}</div>
        )}
        <p className="admin-footnote">Güvenlik için en fazla 100 kayıt listelenir. Bu sürüm mesaj silmez veya değiştirmez.</p>
      </>}
    </section>
  </main>;
}
