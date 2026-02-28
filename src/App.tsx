import { useState, useEffect, useRef } from 'react'
import { DIAS, SOS_AUDIOS, FASES, type Dia, type SosAudio } from './lib/content'
import { supabase } from './lib/supabase'
import './index.css'

// ───── AUDIO PLAYER HOOK ─────
function useAudioPlayer(url: string) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0) // 0-1
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        audioRef.current = new Audio(url)
        const audio = audioRef.current

        audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
        audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime)
            setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0)
        })
        audio.addEventListener('ended', () => setPlaying(false))

        return () => { audio.pause(); audio.src = '' }
    }, [url])

    const toggle = () => {
        if (!audioRef.current) return
        if (playing) { audioRef.current.pause(); setPlaying(false) }
        else { audioRef.current.play().catch(() => { }); setPlaying(true) }
    }

    const seek = (ratio: number) => {
        if (!audioRef.current || !duration) return
        audioRef.current.currentTime = ratio * duration
    }

    return { playing, progress, currentTime, duration, toggle, seek }
}

function fmtTime(sec: number) {
    if (!isFinite(sec)) return '00:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ───── WAVEFORM VISUAL ─────
function Waveform({ progress, onClick }: { progress: number; onClick: (r: number) => void }) {
    const NUM = 48
    const heights = useRef(Array.from({ length: NUM }, (_, i) => {
        const pos = i / NUM
        return 20 + 60 * Math.sin(pos * Math.PI * 3) * 0.5 + 10 + Math.random() * 10
    }))

    return (
        <div
            className="waveform-container"
            onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                onClick((e.clientX - rect.left) / rect.width)
            }}
        >
            {heights.current.map((h, i) => {
                const ratio = i / NUM
                let cls = 'waveform-bar'
                if (ratio < progress - 0.02) cls += ' played'
                else if (Math.abs(ratio - progress) < 0.02) cls += ' active'
                return (
                    <div
                        key={i}
                        className={cls}
                        style={{ height: `${h}%` }}
                    />
                )
            })}
        </div>
    )
}

// ───── ACTIVE PLAYER CARD ─────
function PlayerCard({ dia, onComplete, completed, loadingComplete }: {
    dia: Dia
    onComplete: () => void
    completed: boolean
    loadingComplete?: boolean
}) {
    const { playing, progress, currentTime, duration, toggle, seek } = useAudioPlayer(dia.audioUrl)
    const fase = FASES[dia.fase]

    return (
        <div className="player-card">
            <div className={`player-cover ${playing ? 'playing' : ''}`}>🛡️</div>
            <div className="player-info">
                <p className="player-phase">{fase.icon} DIA {String(dia.id).padStart(2, '0')} • {fase.nome.toUpperCase()}</p>
                <h3 className="player-title">{dia.titulo}</h3>
                <div className="player-controls">
                    <button className="btn-play" onClick={toggle}>
                        {playing ? '⏸' : '▶'}
                    </button>
                    <span className="player-time">{fmtTime(currentTime)}</span>
                    <Waveform progress={progress} onClick={seek} />
                    <span className="player-time">{duration > 0 ? fmtTime(duration) : dia.duracao}</span>
                    <button
                        className={`btn-complete ${completed ? 'completed' : ''}`}
                        onClick={!completed && !loadingComplete ? onComplete : undefined}
                        disabled={loadingComplete}
                    >
                        {loadingComplete ? 'Salvando...' : completed ? '✓ Concluído' : '✓ Marcar Concluído'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ───── JORNADA VIEW ─────
function JornadaView({ concluidos, setConcluidos, updateProgress }: {
    concluidos: number[]
    setConcluidos: React.Dispatch<React.SetStateAction<number[]>>
    updateProgress: (newDay: number) => Promise<void>
}) {
    const ultimoDia = concluidos.length > 0 ? Math.max(...concluidos) + 1 : 1
    const diaAtual = Math.min(ultimoDia, 30)

    const [faseAtiva, setFaseAtiva] = useState<1 | 2 | 3>(diaAtual <= 10 ? 1 : diaAtual <= 20 ? 2 : 3)
    const [diaAtivo, setDiaAtivo] = useState(DIAS.find(d => d.id === diaAtual)!)
    const [isSaving, setIsSaving] = useState(false)

    // Atualiza o dia ativo caso a pessoa conclua o dia atual dela
    useEffect(() => {
        // Se ela marcou como concluído e estamos vendo o dia novo, avança
        if (concluidos.includes(diaAtivo.id) && diaAtivo.id < 30) {
            setDiaAtivo(DIAS.find(d => d.id === diaAtivo.id + 1)!)
        }
    }, [concluidos])

    const diasDaFase = DIAS.filter(d => d.fase === faseAtiva)

    function getStatus(id: number): 'completed' | 'active' | 'locked' {
        if (concluidos.includes(id)) return 'completed'
        if (id <= ultimoDia) return 'active' // desbloqueado
        return 'locked'
    }

    function progresso() {
        return Math.round((concluidos.length / 30) * 100)
    }

    async function handleComplete(id: number) {
        setIsSaving(true)
        await updateProgress(id)
        setIsSaving(false)
    }

    return (
        <>
            {/* Player ativo */}
            <PlayerCard
                dia={diaAtivo}
                completed={concluidos.includes(diaAtivo.id)}
                onComplete={() => handleComplete(diaAtivo.id)}
                loadingComplete={isSaving}
            />

            {/* Barra de progresso total */}
            <div style={{ marginBottom: 28 }}>
                <div className="progress-label">
                    <span>Progresso da Jornada</span>
                    <span style={{ color: 'var(--gold)' }}>{concluidos.length} / 30 dias • {progresso()}%</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progresso()}%` }} />
                </div>
            </div>

            {/* Tabs de fase */}
            <div className="phase-tabs">
                {([1, 2, 3] as const).map(f => (
                    <button
                        key={f}
                        className={`phase-tab ${faseAtiva === f ? 'active' : ''}`}
                        onClick={() => setFaseAtiva(f)}
                    >
                        {FASES[f].icon} {FASES[f].nome}
                    </button>
                ))}
            </div>

            {/* Grid de dias */}
            <div className="days-grid">
                {diasDaFase.map(dia => {
                    const status = getStatus(dia.id)
                    return (
                        <div
                            key={dia.id}
                            className={`day-card ${status}`}
                            onClick={() => status !== 'locked' && setDiaAtivo(dia)}
                        >
                            <span className="day-num">DIA {String(dia.id).padStart(2, '0')}</span>
                            <h4 className="day-title">{dia.titulo}</h4>
                        </div>
                    )
                })}
            </div>
        </>
    )
}

// ───── SOS VIEW ─────
function SosView({ onPlay }: { onPlay: (audio: SosAudio) => void }) {
    return (
        <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
                Orações poderosas de 3 minutos para momentos de emergência espiritual e emocional. Acesso imediato, sempre disponível.
            </p>
            <div className="sos-grid">
                {SOS_AUDIOS.map(sos => (
                    <div key={sos.id} className="sos-card" onClick={() => onPlay(sos)}>
                        <div className="sos-icon">{sos.icon}</div>
                        <div className="sos-info">
                            <h4>{sos.titulo}</h4>
                            <p>{sos.subtitulo} · {sos.duracao}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

// ───── DOWNLOADS VIEW ─────
function DownloadsView() {
    return (
        <>
            <h2 style={{ fontFamily: 'Cinzel,serif', marginBottom: 28, fontSize: '1.3rem' }}>Biblioteca da Sentinela</h2>
            <div className="download-list">
                <div className="download-item">
                    <div className="download-info">
                        <h3>Guia do Sentinela (PDF)</h3>
                        <p>Livro digital de acompanhamento dos 30 dias com espaço para anotações e reflexões</p>
                    </div>
                    {/* Alterar o Href quando subir os PDFs para algum lugar, ou colocar na pasta public do vite */}
                    <a href="/materiais/guia-do-sentinela.pdf" target="_blank" className="download-btn">⬇ Baixar</a>
                </div>
                <div className="download-item">
                    <div className="download-info">
                        <h3>Roteiro de Consagração do Lar</h3>
                        <p>Passo a passo com as orações impressas para o Ritual Final no Dia 30</p>
                    </div>
                    <a href="/materiais/roteiro-consagracao-lar.pdf" target="_blank" className="download-btn">⬇ Baixar</a>
                </div>
                <div className="download-item">
                    <div className="download-info">
                        <h3>Salmo 91 — Versão para Impressão</h3>
                        <p>Para afixar na entrada da sua casa como declaração de proteção diária</p>
                    </div>
                    <a href="/materiais/salmo-91-impressao.pdf" target="_blank" className="download-btn">⬇ Baixar</a>
                </div>
            </div>
        </>
    )
}

// ───── RITUAL VIEW ─────
function RitualView() {
    const ritual = useAudioPlayer('/audios/ritual_ritual.mp3')
    return (
        <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
                O grande encerramento da sua jornada. Um ritual guiado de 25 minutos para consagrar cada cômodo do seu lar.
            </p>

            {/* Mini player do ritual */}
            <div className="card" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ fontSize: '2.5rem' }}>👑</div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Áudio Principal</p>
                    <h3 style={{ fontFamily: 'Cinzel,serif', marginBottom: 14 }}>Ritual de Consagração — 25 min</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn-play" onClick={ritual.toggle}>{ritual.playing ? '⏸' : '▶'}</button>
                        <Waveform progress={ritual.progress} onClick={ritual.seek} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtTime(ritual.currentTime)}</span>
                    </div>
                </div>
            </div>

            <h3 style={{ marginBottom: 20, fontFamily: 'Cinzel,serif' }}>Passos do Ritual</h3>
            <div className="ritual-steps">
                {[
                    { n: '1', title: 'Preparação Espiritual (0–5 min)', desc: 'Tenha Água Benta ou azeite em mãos. Reúna sua família.' },
                    { n: '2', title: 'Sala e Cozinha (5–10 min)', desc: 'Consagração da convivência, do alimento e da alegria.' },
                    { n: '3', title: 'Quartos dos Filhos e do Casal (10–15 min)', desc: 'Proteção dos sonhos, castidade e amor conjugal.' },
                    { n: '4', title: 'Portas de Entrada (15–20 min)', desc: 'Declaração: "Aqui mora Deus. O inimigo não tem poder aqui."' },
                    { n: '5', title: 'Oração Final de Louvor (20–25 min)', desc: 'Gratidão e selo da vitória eterna sobre o lar.' },
                ].map(step => (
                    <div key={step.n} className="ritual-step">
                        <div className="step-num">{step.n}</div>
                        <div className="step-text">
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

// ───── SOS MINI PLAYER MODAL ─────
function SosMiniPlayer({ sos, onClose }: { sos: SosAudio; onClose: () => void }) {
    const { playing, progress, currentTime, duration, toggle, seek } = useAudioPlayer(sos.audioUrl)

    return (
        <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: '#18181b', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 14, padding: '18px 24px', zIndex: 999,
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            minWidth: 360, maxWidth: '90vw',
        }}>
            <div style={{ fontSize: '1.6rem' }}>{sos.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.7rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>SOS Ativo</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sos.titulo}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <button className="btn-play" style={{ width: 36, height: 36, fontSize: '0.85rem' }} onClick={toggle}>{playing ? '⏸' : '▶'}</button>
                    <Waveform progress={progress} onClick={seek} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fmtTime(currentTime)}/{fmtTime(duration || 0)}</span>
                </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: 4 }}>✕</button>
        </div>
    )
}

// ───── LOGIN PAGE (Auth Real com Supabase) ─────
function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [erro, setErro] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email || !senha) return setErro('Preencha todos os campos.')

        setLoading(true)
        setErro('')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: senha
        })

        if (error) {
            setLoading(false)
            if (error.message.includes("Invalid login")) {
                setErro('Email ou senha incorretos.')
            } else {
                setErro(error.message)
            }
            return
        }

        // Sucesso - o App.tsx vai escutar a mudança de sessão automaticamente
        onLoginSuccess()
    }

    // Como já é tudo controlado pelo produtor, deixei só login. 
    // O usuário é criado pelo Webhook.
    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-shield">🛡️</div>
                    <h1 style={{ fontFamily: 'Cinzel,serif' }}>Escudo de Luz</h1>
                    <p style={{ color: 'var(--gold)' }}>Acesso do Sentinela</p>
                </div>

                {erro && <div className="error-msg">{erro}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input className="form-input" type="email" placeholder="Seu email de compra"
                            value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Senha</label>
                        <input className="form-input" type="password" placeholder="Sua senha recebida"
                            value={senha} onChange={e => setSenha(e.target.value)} />
                    </div>
                    <button className="btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Acessando...' : '✦ Entrar no meu Quartel General'}
                    </button>
                </form>

                <div className="form-switch">
                    <span style={{ fontSize: '0.85rem' }}>Dúvidas de acesso? Fale com o suporte.</span>
                </div>
            </div>
        </div>
    )
}

// ───── APP PRINCIPAL ─────
type Tab = 'jornada' | 'sos' | 'downloads' | 'ritual'

export default function App() {
    const [session, setSession] = useState<any>(null)
    const [loadingAuth, setLoadingAuth] = useState(true)

    const [tab, setTab] = useState<Tab>('jornada')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [concluidos, setConcluidos] = useState<number[]>([])
    const [sosAtivo, setSosAtivo] = useState<typeof SOS_AUDIOS[0] | null>(null)

    // Escutar Sessão e Buscar Perfil
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session) fetchProfile(session.user.id)
            else setLoadingAuth(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session) fetchProfile(session.user.id)
        })

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId: string) {
        setLoadingAuth(true)
        const { data, error } = await supabase
            .from('escudo_profiles')
            .select('dias_concluidos')
            .eq('id', userId)
            .single()

        if (data) {
            setConcluidos(data.dias_concluidos || [])
        } else if (error) {
            console.error("Erro ao puxar perfil:", error)
        }
        setLoadingAuth(false)
    }

    async function salvarProgresso(novoDia: number) {
        if (!session?.user?.id) return

        const atualizados = [...new Set([...concluidos, novoDia])].sort((a, b) => a - b)

        // Atualiza UI de forma otimista
        setConcluidos(atualizados)

        // Salva no banco
        const { error } = await supabase
            .from('escudo_profiles')
            .update({ dias_concluidos: atualizados })
            .eq('id', session.user.id)

        if (error) {
            console.error("Erro ao salvar progresso:", error)
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut()
    }

    if (loadingAuth) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>Carregando o Quartel General...</div>
    }

    if (!session) {
        return <LoginPage onLoginSuccess={() => { }} />
    }

    const progresso = Math.round((concluidos.length / 30) * 100)

    const navItems: { id: Tab; label: string; icon: string }[] = [
        { id: 'jornada', label: 'Jornada de 30 Dias', icon: '🗺️' },
        { id: 'sos', label: 'Áudios SOS', icon: '🆘' },
        { id: 'downloads', label: 'Materiais & PDFs', icon: '📥' },
        { id: 'ritual', label: 'Ritual de Consagração', icon: '👑' },
    ]

    const titulos: Record<Tab, { h: string, sub: string }> = {
        jornada: { h: `Bem-vindo de volta, Sentinela`, sub: 'Continue fortalecendo o seu lar diariamente.' },
        sos: { h: 'Módulo de Emergência (SOS)', sub: 'Acesse socorro espiritual imediato para momentos de crise.' },
        downloads: { h: 'Biblioteca da Sentinela', sub: 'Baixe os PDFs e recursos complementares da sua jornada.' },
        ritual: { h: 'Ritual de Consagração', sub: 'O grande encerramento dos 30 dias. Sele a vitória do seu lar.' },
    }

    return (
        <div className="app-layout">
            {/* Mobile overlay */}
            <div
                className={`mobile-overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="brand-shield">🛡️</div>
                    <div className="brand-text">
                        <h2>Escudo de Luz</h2>
                        <p>Sentinela Premium</p>
                    </div>
                </div>

                <div className="sidebar-progress">
                    <div className="progress-label">
                        <span>Progresso Total</span>
                        <span style={{ color: 'var(--gold)' }}>{progresso}%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progresso}%` }} />
                    </div>
                    <p className="progress-days">{concluidos.length} de 30 dias concluídos</p>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${tab === item.id ? 'active' : ''}`}
                            onClick={() => { setTab(item.id); setSidebarOpen(false) }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 Sair da Jornada
                    </button>
                </div>
            </aside>

            {/* Mobile topbar */}
            <div className="mobile-topbar">
                <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                <span style={{ fontFamily: 'Cinzel,serif', fontSize: '0.95rem', color: 'var(--gold)' }}>Escudo de Luz</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{progresso}%</span>
            </div>

            {/* Main */}
            <main className="main-content">
                <div className="page-header">
                    <h1>{titulos[tab].h}</h1>
                    <p>{titulos[tab].sub}</p>
                </div>

                {tab === 'jornada' && <JornadaView concluidos={concluidos} setConcluidos={setConcluidos} updateProgress={salvarProgresso} />}
                {tab === 'sos' && <SosView onPlay={setSosAtivo} />}
                {tab === 'downloads' && <DownloadsView />}
                {tab === 'ritual' && <RitualView />}
            </main>

            {/* SOS Mini Player */}
            {sosAtivo && <SosMiniPlayer sos={sosAtivo} onClose={() => setSosAtivo(null)} />}
        </div>
    )
}
