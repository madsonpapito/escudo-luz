import os
import glob
import subprocess

# Caminhos dos arquivos
AUDIO_PATH = r"c:\Users\madso\OneDrive\Área de Trabalho\AIOS\squads\renova-30\escudo-de-luz\audio-vsl-escudo-de-luz.mp3"
IMAGES_DIR = r"c:\Users\madso\OneDrive\Área de Trabalho\AIOS\squads\renova-30\escudo-de-luz\imagens-vsl"
OUTPUT_VIDEO = r"c:\Users\madso\OneDrive\Área de Trabalho\AIOS\squads\renova-30\escudo-de-luz\vsl-final.mp4"
CONCAT_FILE = r"c:\Users\madso\OneDrive\Área de Trabalho\AIOS\squads\renova-30\escudo-de-luz\imagens_concat.txt"

def get_audio_duration(audio_file):
    cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', audio_file]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return float(result.stdout.strip())

def criar_vsl():
    print("🎥 Iniciando o carregamento dos assets para a VSL via FFmpeg...")
    
    try:
        duracao_total_audio = get_audio_duration(AUDIO_PATH)
        print(f"🔊 Áudio carregado. Duração total: {duracao_total_audio:.2f} segundos.")
    except Exception as e:
        print(f"❌ Erro ao ler áudio com ffprobe: {e}")
        return

    # Buscar todas as imagens na pasta
    padrao = os.path.join(IMAGES_DIR, "cena_*.webp")
    arquivos_imagens = sorted(glob.glob(padrao))
    
    if not arquivos_imagens:
        print("❌ Nenhuma imagem encontrada na pasta.")
        return
        
    quantidade_imagens = len(arquivos_imagens)
    tempo_por_imagem = duracao_total_audio / quantidade_imagens
    print(f"🖼️ Foram encontradas {quantidade_imagens} imagens.")
    print(f"⏱️ Tempo de tela calculado para cada imagem: {tempo_por_imagem:.2f} segundos.")

    print("⚙️ Criando arquivo de demux para o FFmpeg...")
    with open(CONCAT_FILE, "w", encoding="utf-8") as f:
        for idx, img_path in enumerate(arquivos_imagens):
            img_path_safe = img_path.replace("\\", "/") # formato aceito pelo ffmpeg
            f.write(f"file '{img_path_safe}'\n")
            f.write(f"duration {tempo_por_imagem:.3f}\n")
        # Segundo a documentação do concat demuxer, para evitar problemas de fps com a ultima imagem:
        f.write(f"file '{arquivos_imagens[-1].replace(chr(92), '/')}'\n")

    print(f"🎬 Iniciando Renderização super rápida via FFmpeg...")
    
    # FFmpeg command:
    # -f concat -safe 0 -i imagens_concat.txt -> le as imagens
    # -i audio.mp3 -> le o audio
    # -vf format=yuv420p,scale=1920:1080 -> garante o formato de saida h264 e forca o 16:9
    # -c:v libx264 -c:a aac -shortest -> renderiza h264 e aac finalizando na duracao do mais curto
    
    if os.path.exists(OUTPUT_VIDEO):
        os.remove(OUTPUT_VIDEO)

    ffmpeg_cmd = [
        'ffmpeg', '-y',
        '-f', 'concat', '-safe', '0', '-i', CONCAT_FILE,
        '-i', AUDIO_PATH,
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest',
        '-pix_fmt', 'yuv420p',
        OUTPUT_VIDEO
    ]
    
    process = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    if process.returncode == 0:
        print(f"✅ VSL Renderizada com Escambo de Sucesso em: {OUTPUT_VIDEO}")
    else:
        print(f"❌ Ocorreu um erro no FFmpeg:")
        print(process.stderr)
        
    # Limpeza
    if os.path.exists(CONCAT_FILE):
        os.remove(CONCAT_FILE)

if __name__ == "__main__":
    criar_vsl()
