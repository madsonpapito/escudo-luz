// ===== DADOS DOS 30 DIAS + SOS + RITUAL =====

export type Fase = 1 | 2 | 3

export interface Dia {
    id: number
    fase: Fase
    titulo: string
    // URL demo de áudio público (substituir pelos reais depois)
    audioUrl: string
    duracao: string // "06:45"
}

export interface SosAudio {
    id: number
    titulo: string
    subtitulo: string
    icon: string
    audioUrl: string
    duracao: string
}

// Áudios demo públicos (meditação/classica do archive.org)
const DEMO_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
const SOS_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'

export const DIAS: Dia[] = [
    // FASE 1 — Diagnóstico
    { id: 1, fase: 1, titulo: 'O Despertar da Sentinela', audioUrl: DEMO_AUDIO, duracao: '06:30' },
    { id: 2, fase: 1, titulo: 'As Brechas da Tristeza', audioUrl: DEMO_AUDIO, duracao: '06:45' },
    { id: 3, fase: 1, titulo: 'Purificando os Olhos da Casa', audioUrl: DEMO_AUDIO, duracao: '07:00' },
    { id: 4, fase: 1, titulo: 'O Sangue sobre o Passado Familiar', audioUrl: DEMO_AUDIO, duracao: '06:20' },
    { id: 5, fase: 1, titulo: 'Quebrando Palavras de Maldição', audioUrl: DEMO_AUDIO, duracao: '05:50' },
    { id: 6, fase: 1, titulo: 'A Força do Perdão no Lar', audioUrl: DEMO_AUDIO, duracao: '06:40' },
    { id: 7, fase: 1, titulo: 'Protegendo o Matrimônio', audioUrl: DEMO_AUDIO, duracao: '07:10' },
    { id: 8, fase: 1, titulo: 'Livrando os Filhos das Falanges', audioUrl: DEMO_AUDIO, duracao: '06:55' },
    { id: 9, fase: 1, titulo: 'A Inveja como Porta de Entrada', audioUrl: DEMO_AUDIO, duracao: '06:15' },
    { id: 10, fase: 1, titulo: 'Fechamento com São Miguel', audioUrl: DEMO_AUDIO, duracao: '07:30' },

    // FASE 2 — Armadura de Deus
    { id: 11, fase: 2, titulo: 'O Cinturão da Verdade', audioUrl: DEMO_AUDIO, duracao: '06:45' },
    { id: 12, fase: 2, titulo: 'A Couraça da Justiça', audioUrl: DEMO_AUDIO, duracao: '06:30' },
    { id: 13, fase: 2, titulo: 'Os Calçados do Evangelho da Paz', audioUrl: DEMO_AUDIO, duracao: '06:00' },
    { id: 14, fase: 2, titulo: 'O Escudo da Fé', audioUrl: DEMO_AUDIO, duracao: '07:15' },
    { id: 15, fase: 2, titulo: 'O Capacete da Salvação', audioUrl: DEMO_AUDIO, duracao: '06:50' },
    { id: 16, fase: 2, titulo: 'A Espada do Espírito', audioUrl: DEMO_AUDIO, duracao: '06:40' },
    { id: 17, fase: 2, titulo: 'O Poder do Rosário', audioUrl: DEMO_AUDIO, duracao: '07:00' },
    { id: 18, fase: 2, titulo: 'Anjos da Guarda', audioUrl: DEMO_AUDIO, duracao: '06:25' },
    { id: 19, fase: 2, titulo: 'O Nome Acima de Todo Nome', audioUrl: DEMO_AUDIO, duracao: '07:20' },
    { id: 20, fase: 2, titulo: 'A Intercessão dos Santos', audioUrl: DEMO_AUDIO, duracao: '06:35' },

    // FASE 3 — Consagração
    { id: 21, fase: 3, titulo: 'A Água Benta, o Sal e o Óleo', audioUrl: DEMO_AUDIO, duracao: '06:10' },
    { id: 22, fase: 3, titulo: 'O Sangue nos Umbrais', audioUrl: DEMO_AUDIO, duracao: '06:45' },
    { id: 23, fase: 3, titulo: 'Consagração da Mente Familiar', audioUrl: DEMO_AUDIO, duracao: '06:30' },
    { id: 24, fase: 3, titulo: 'Consagração das Finanças', audioUrl: DEMO_AUDIO, duracao: '07:00' },
    { id: 25, fase: 3, titulo: 'A Mesa como Altar de Comunhão', audioUrl: DEMO_AUDIO, duracao: '06:20' },
    { id: 26, fase: 3, titulo: 'O Quarto como Refúgio de Paz', audioUrl: DEMO_AUDIO, duracao: '06:55' },
    { id: 27, fase: 3, titulo: 'Entregando a Árvore Genealógica', audioUrl: DEMO_AUDIO, duracao: '07:10' },
    { id: 28, fase: 3, titulo: 'O Manto Sagrado de Maria', audioUrl: DEMO_AUDIO, duracao: '06:40' },
    { id: 29, fase: 3, titulo: 'Louvor: A Arma Incontestável', audioUrl: DEMO_AUDIO, duracao: '07:30' },
    { id: 30, fase: 3, titulo: 'O Grande Selo da Vitória Eterna', audioUrl: DEMO_AUDIO, duracao: '08:00' },
]

export const SOS_AUDIOS: SosAudio[] = [
    { id: 1, titulo: 'Crise de Ansiedade e Pânico', subtitulo: 'Respiração guiada + Salmo 91', icon: '🫁', audioUrl: SOS_AUDIO, duracao: '03:00' },
    { id: 2, titulo: 'Brigas no Lar / Tempestade', subtitulo: 'Invocando a paz de Cristo', icon: '🏠', audioUrl: SOS_AUDIO, duracao: '03:00' },
    { id: 3, titulo: 'Ataque de Inércia / Desânimo', subtitulo: 'Para dias de depressão profunda', icon: '⚡', audioUrl: SOS_AUDIO, duracao: '03:00' },
    { id: 4, titulo: 'Medo do Futuro / Desespero', subtitulo: 'Renovação da esperança', icon: '🌅', audioUrl: SOS_AUDIO, duracao: '03:00' },
    { id: 5, titulo: 'Ataque Noturno / Insônia', subtitulo: 'Oração para dormir em paz', icon: '🌙', audioUrl: SOS_AUDIO, duracao: '03:00' },
    { id: 6, titulo: 'Emergência Financeira', subtitulo: 'Invocando a Providência Divina', icon: '💛', audioUrl: SOS_AUDIO, duracao: '03:00' },
    { id: 7, titulo: 'Vícios e Tentações', subtitulo: 'Blindagem rápida contra recaídas', icon: '🛡️', audioUrl: SOS_AUDIO, duracao: '03:00' },
]

export const FASES = {
    1: { nome: 'Fase 1 — Diagnóstico', dias: [1, 10] as [number, number], icon: '🔍' },
    2: { nome: 'Fase 2 — Armadura', dias: [11, 20] as [number, number], icon: '🛡️' },
    3: { nome: 'Fase 3 — Consagração', dias: [21, 30] as [number, number], icon: '👑' },
}
