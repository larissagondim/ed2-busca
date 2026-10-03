#!/usr/bin/env python3
"""Gera somente derivados; nunca modifica o CSV ou as imagens de origem.

Requer Python 3 e Pillow (python3-pil). Execute na raiz do repositório.
"""
import argparse
import csv
import random
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageOps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalogo', type=Path, default=Path('data/classes.csv'))
    parser.add_argument('--saida', type=Path, default=Path('deploy/catalogo'))
    parser.add_argument('--por-estilo', type=int, default=20)
    args = parser.parse_args()
    if args.por_estilo < 1:
        parser.error('--por-estilo deve ser positivo')
    if args.saida.exists() and any(args.saida.iterdir()):
        parser.error('A saída já contém arquivos. Use --saida com um diretório novo.')
    grupos = defaultdict(list)
    with args.catalogo.open(encoding='utf-8-sig', newline='') as arquivo:
        leitor = csv.DictReader(arquivo)
        campos = leitor.fieldnames
        for indice, obra in enumerate(leitor):
            grupos[obra['estilo']].append((indice, obra))
    imagens = args.saida / 'imagens'
    imagens.mkdir(parents=True, exist_ok=True)
    selecionadas = []
    rng = random.Random(20261003)
    for estilo, obras in sorted(grupos.items()):
        rng.shuffle(obras)
        quantidade = 0
        for indice, obra in obras:
            try:
                with Image.open(obra['caminho_imagem']) as original:
                    imagem = ImageOps.exif_transpose(original).convert('RGB')
                    imagem.thumbnail((480, 480), Image.Resampling.LANCZOS)
                    destino = imagens / f'{indice:05d}.jpg'
                    imagem.save(destino, 'JPEG', quality=75, optimize=True)
            except (OSError, ValueError) as erro:
                print(f'Ignorando imagem indisponível: {obra["caminho_imagem"]}: {erro}')
                continue
            selecionadas.append((indice, {**obra, 'caminho_imagem': destino.as_posix()}))
            quantidade += 1
            if quantidade == args.por_estilo:
                break
        if quantidade != args.por_estilo:
            raise RuntimeError(f'{estilo}: somente {quantidade} imagens disponíveis')
    with (args.saida / 'classes.csv').open('w', encoding='utf-8', newline='') as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=campos, lineterminator='\n')
        escritor.writeheader()
        escritor.writerows(obra for _, obra in sorted(selecionadas))
    tamanho = sum(p.stat().st_size for p in args.saida.rglob('*') if p.is_file())
    print(f'{len(selecionadas)} obras, {len(grupos)} estilos, {tamanho} bytes ({tamanho / 1024**2:.2f} MiB)')


if __name__ == '__main__':
    main()
