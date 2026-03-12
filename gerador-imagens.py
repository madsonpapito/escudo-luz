import os
import json
import time
import requests
import replicate
from dotenv import load_dotenv
from pathlib import Path

# Carregar variáveis de ambiente local
load_dotenv(r"c:\Users\madso\OneDrive\Área de Trabalho\AIOS\.env")
os.environ["REPLICATE_API_TOKEN"] = os.getenv("REPLICATE_API_TOKEN")

PROMPTS_FILE = r"c:\Users\madso\OneDrive\Área de Trabalho\AIOS\squads\renova-30\escudo-de-luz\vsl-timeline-prompts.md"
OUTPUT_DIR = r"c:\Users\madso\OneDrive\Área de Trabalho\AIOS\squads\renova-30\escudo-de-luz\imagens-vsl"

def get_prompts(file_path):
    prompts = []
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
        
    for line in lines:
        if "|" in line and ("**0" in line or "**" in line):
            parts = line.split("|")
            if len(parts) >= 3:
                # Extrai o prompt limpo da terceira coluna markdown
                prompt_text = parts[2].strip().replace("*", "")
                if prompt_text and prompt_text != "Prompt de Imagem (Midjourney/DALL-E)" and prompt_text != "Prompt de Imagem Recomendado (Midjourney/DALL-E)":
                    prompts.append(prompt_text)
                    
    return prompts

def download_image(url, filepath):
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        return True
    return False

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    prompts = get_prompts(PROMPTS_FILE)
    
    print(f"Iniciando a geração de {len(prompts)} imagens utilizando Flux Schnell...")
    
    for i, prompt in enumerate(prompts):
        index = i + 1
        output_file = os.path.join(OUTPUT_DIR, f"cena_{index:03d}.webp") # Flux Schnell geralmente retorna em webp
        
        # Pula se a imagem já existir (proteção para não gastar saldo a toa caso o script trave)
        if os.path.exists(output_file):
            print(f"[{index}/{len(prompts)}] Pulando Cena {index}: Imagem já existe.")
            continue
            
        print(f"\n[{index}/{len(prompts)}] Gerando Cena {index}...")
        print(f"Prompt: {prompt}")
        
        try:
            # Usar Flux Schnell via Replicate
            # Modelo: black-forest-labs/flux-schnell
            output = replicate.run(
                "black-forest-labs/flux-schnell",
                input={
                    "prompt": prompt,
                    "aspect_ratio": "16:9", # Formato de vídeo VSL
                    "output_format": "webp",
                    "output_quality": 80
                }
            )
            
            # O output é geralmente uma lista com um Image URL
            if isinstance(output, list) and len(output) > 0:
                image_url = output[0]
                print(f"Imagem gerada com sucesso! Baixando...")
                
                # Baixar e salvar localmente
                if download_image(image_url, output_file):
                    print(f"✓ Salva em: cena_{index:03d}.webp")
                else:
                    print("✖ Erro ao baixar a imagem.")
            else:
                # Caso a API tenha mudado e retorne objeto ao invés de lista. Replicate pode usar generator tbm.
                print("Output inesperado da API:", output)
                
        except Exception as e:
            print(f"✖ Erro ao gerar Cena {index}: {e}")
            
        # Pequena pausa para evitar rate limits exagerados da API
        time.sleep(1)

    print("\n✅ Processo de geração concluído!")
