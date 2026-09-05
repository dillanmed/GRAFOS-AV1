import json # Serialização para consumo de API
import urllib.request # Requisição HTTP para consumo de API

def carregar_grafo_brasil():
  # URL contendo mapeamento do Brasil
  url = "https://gist.githubusercontent.com/ae78c39753593aec262c/raw/brazil-states.json"

  # Download dos dados
  with urllib.request.urlopen(url) as resposta:
    dados_json = json.loads(resposta.read().decode())

  # Lista de UFs (siglas) dinamicamente
  ufs = sorted([estado["sigla"] for estado in dados_json])
  return ufs

# Mapeamento de fronteiras das UFs
FRONTEIRAS_BR = {
    "AC": ["AM", "RO"],
    "AL": ["PE", "SE", "BA"],
    "AM": ["AC", "RO", "MT", "PA", "RR"],
    "AP": ["PA"],
    "BA": ["SE", "AL", "PE", "PI", "TO", "MG", "ES"],
    "CE": ["PI", "PE", "PB", "RN"],
    "DF": ["GO"],
    "ES": ["BA", "MG", "RJ"],
    "GO": ["TO", "BA", "MG", "MS", "MT", "DF"],
    "MA": ["PA", "TO", "PI"],
    "MG": ["BA", "ES", "RJ", "SP", "MS", "GO", "DF"],
    "MS": ["MT", "GO", "MG", "SP", "PR"],
    "MT": ["AM", "PA", "TO", "GO", "MS", "RO"],
    "PA": ["AP", "AM", "MT", "TO", "MA"],
    "PB": ["CE", "PE", "RN"],
    "PE": ["CE", "PB", "AL", "BA", "PI"],
    "PI": ["CE", "PE", "BA", "TO", "MA"],
    "PR": ["MS", "SP", "SC"],
    "RJ": ["ES", "MG", "SP"],
    "RN": ["CE", "PB"],
    "RO": ["AC", "AM", "MT"],
    "RR": ["AM", "PA"],
    "RS": ["SC"],
    "SC": ["PR", "RS"],
    "SE": ["AL", "BA"],
    "SP": ["MS", "MG", "RJ", "PR"],
    "TO": ["PA", "MA", "PI", "BA", "GO", "MT"],
}

class GrafoUFsNativo:

  def __init__(self, dicionario_fronteiras):
    self.adjacencias = dicionario_fronteiras
    self.ufs = sorted(list(dicionario_fronteiras.keys()))

  def lista_adjacencia(self): # Retorna a lista de adjacência
    return self.adjacencias

  def matriz_adjacencia(self): # Gera a matriz de adjacência usando listas nativas
    n = len(self.ufs)
    uf_para_indice = {uf: i for i, uf in enumerate(self.ufs)}

    matriz = [[0] * n for _ in range(n)]
    for u, vizinhos in self.adjacencias.items():
      i = uf_para_indice[u]
      for v in vizinhos:
        if v in uf_para_indice:
          j = uf_para_indice[v]
          matriz[i][j] = 1
    return matriz, self.ufs

  def lista_indexada(self): # Gera a lista indexada
    vetor_indexado = []
    for i, uf in enumerate(self.ufs):
      vizinhos = self.adjacencias.get(uf, [])
      vetor_indexado.append({"indice": i, "uf": uf, "fronteiras": vizinhos})
    return vetor_indexado

  def colorir_mapa(self): # Algoritmo guloso baseado na heurística de grau
    # Ordena os estados pelo número de vizinhos em ordem decrescente
    ufs_ordenadas = sorted(self.ufs, key=lambda u: len(self.adjacencias.get(u, [])), reverse=True)
    
    paleta_cores = ["Azul", "Verde", "Amarelo", "Vermelho", "Roxo"]
    atribuicao_cores = {}
    
    for uf in ufs_ordenadas:
      # Cores já utilizadas pelos estados vizinhos coloridos
      cores_vizinhos = {atribuicao_cores[v] for v in self.adjacencias.get(uf, []) if v in atribuicao_cores}
      
      # Atribui a primeira cor disponível na paleta que não conflita com os vizinhos
      for cor in paleta_cores:
        if cor not in cores_vizinhos:
          atribuicao_cores[uf] = cor
          break
          
    return atribuicao_cores


# Execução do Código
grafo = GrafoUFsNativo(FRONTEIRAS_BR)

# Testa a lista de adjacência
la = grafo.lista_adjacencia()
print("Lista de Adjacência para 'SP'")
print(la["SP"])
print()

# Testa a matriz de adjacência
matriz, ordem_ufs = grafo.matriz_adjacencia()
print("Matriz de Adjacência (Amostra 5x5)")
print(f"Ordem das UFs: {ordem_ufs[:5]}")
for linha in matriz[:5]:
  print(linha[:5])
print()

# Testa a lista indexada
li = grafo.lista_indexada()
print("Amostra da Lista Indexada")
for item in li[:3]:
  print(
      f"Índice {item['indice']} ({item['uf']}) -> Fronteiras:"
      f" {item['fronteiras']}"
  )
print()

# Testa a coloração do mapa
cores_brasil = grafo.colorir_mapa()
print("Coloração das UFs (Estado -> Cor):")
for uf, cor in sorted(cores_brasil.items()):
  print(f"{uf}: {cor}")