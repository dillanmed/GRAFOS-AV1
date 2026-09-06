/* ==========================================================================
   1. CONSTANTES E ESTADO GLOBAL
   ========================================================================== */

// Dados de fallback para fronteiras entre estados (Grafo de Adjacência)
const LOCAL_GRAPH = {
  AC: ["AM", "RO"],
  AL: ["PE", "SE", "BA"],
  AM: ["AC", "RO", "MT", "PA", "RR"],
  AP: ["PA"],
  BA: ["SE", "AL", "PE", "PI", "TO", "MG", "ES"],
  CE: ["PI", "PE", "PB", "RN"],
  DF: ["GO"],
  ES: ["BA", "MG", "RJ"],
  GO: ["TO", "BA", "MG", "MS", "MT", "DF"],
  MA: ["PA", "TO", "PI"],
  MG: ["BA", "ES", "RJ", "SP", "MS", "GO", "DF"],
  MS: ["MT", "GO", "MG", "SP", "PR"],
  MT: ["AM", "PA", "TO", "GO", "MS", "RO"],
  PA: ["AP", "AM", "MT", "TO", "MA"],
  PB: ["CE", "PE", "RN"],
  PE: ["CE", "PB", "AL", "BA", "PI"],
  PI: ["CE", "PE", "BA", "TO", "MA"],
  PR: ["MS", "SP", "SC"],
  RJ: ["ES", "MG", "SP"],
  RN: ["CE", "PB"],
  RO: ["AC", "AM", "MT"],
  RR: ["AM", "PA"],
  RS: ["SC"],
  SC: ["PR", "RS"],
  SE: ["AL", "BA"],
  SP: ["MS", "MG", "RJ", "PR"],
  TO: ["PA", "MA", "PI", "BA", "GO", "MT"]
};

const STATES = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul", MT: "Mato Grosso",
  PA: "Pará", PB: "Paraíba", PE: "Pernambuco", PI: "Piauí", PR: "Paraná",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RO: "Rondônia", RR: "Roraima",
  RS: "Rio Grande do Sul", SC: "Santa Catarina", SE: "Sergipe", SP: "São Paulo",
  TO: "Tocantins"
};

const PALETTE = {
  Azul: "#4e7fd5",
  Verde: "#37a57d",
  Amarelo: "#eab847",
  Vermelho: "#db6a70",
  Roxo: "#8869c7"
};

let graph = LOCAL_GRAPH;
let colors = {};
let selectedUF = null;
let svgDocument = null;

/* ==========================================================================
   2. LÓGICA DE GRAFOS E CARREGAMENTO DE DADOS
   ========================================================================== */

/**
 * Coloração Gulosa (Greedy Coloring) para o grafo
 */
function greedyColoring(adjacency) {
  const result = {};
  
  // Ordena os vértices pelo maior grau (número de vizinhos)
  const ordered = Object.keys(adjacency).sort(
    (a, b) => adjacency[b].length - adjacency[a].length || a.localeCompare(b)
  );

  ordered.forEach(uf => {
    // Cores já utilizadas pelos vizinhos
    const usedColors = new Set(
      adjacency[uf].filter(v => result[v]).map(v => result[v])
    );

    // Atribui a primeira cor disponível na paleta
    result[uf] = Object.keys(PALETTE).find(color => !usedColors.has(color));
  });

  return result;
}

async function loadGraph() {
  // Pronto para substituição por chamada de API real no futuro
  return {
    fronteiras: LOCAL_GRAPH,
    coloracao: greedyColoring(LOCAL_GRAPH)
  };
}

/* ==========================================================================
   3. MANIPULAÇÃO E RENDERIZAÇÃO DA INTERFACE (DOM)
   ========================================================================== */

function populateSelect() {
  const select = document.querySelector('#stateSelect');
  
  Object.keys(STATES)
    .sort((a, b) => STATES[a].localeCompare(STATES[b]))
    .forEach(uf => select.add(new Option(`${STATES[uf]} (${uf})`, uf)));

  document.querySelector('#ufCount').textContent = Object.keys(graph).length;
}

function renderLegend() {
  const legend = document.querySelector('#legend');
  legend.innerHTML = Object.entries(PALETTE)
    .map(([name, color]) => `
      <span class="legend-item">
        <i class="legend-swatch" style="background:${color}"></i>${name}
      </span>
    `)
    .join('');
}

function getPath(uf) {
  return svgDocument?.querySelector(`[data-uf="${uf}"]`);
}

function paintMap() {
  Object.keys(graph).forEach(uf => {
    const state = getPath(uf);
    if (state) {
      state.querySelectorAll('path').forEach(path => {
        path.style.fill = PALETTE[colors[uf]];
      });
    }
  });
}

function selectState(uf) {
  if (!graph[uf]) return;

  selectedUF = uf;
  document.querySelector('#stateSelect').value = uf;

  // Reseta destaques no mapa SVG
  svgDocument.querySelectorAll('.estado').forEach(el => el.classList.remove('selected', 'neighbor'));

  // Destaca o estado selecionado e seus vizinhos
  getPath(uf)?.classList.add('selected');
  graph[uf].forEach(neighbor => getPath(neighbor)?.classList.add('neighbor'));

  // Atualiza os dados do Card Lateral
  const neighbors = graph[uf];
  const card = document.querySelector('#stateCard');
  card.classList.remove('empty');

  document.querySelector('.state-code').textContent = uf;
  document.querySelector('#stateName').textContent = STATES[uf];
  document.querySelector('#stateDescription').textContent = `${STATES[uf]} possui ${neighbors.length} fronteira${neighbors.length !== 1 ? 's' : ''} no grafo.`;
  document.querySelector('#degreeValue').textContent = neighbors.length;
  document.querySelector('#colorDot').style.background = PALETTE[colors[uf]];
  
  // Renderiza chips dos vizinhos
  document.querySelector('#neighborChips').innerHTML = neighbors
    .map(v => `<button class="chip" type="button" data-neighbor="${v}" title="Visualizar ${STATES[v]}">${v}</button>`)
    .join('');

  document.querySelector('#adjacencyList').textContent = `${uf} → ${neighbors.join(', ')}`;

  // Adiciona evento de clique aos chips criados
  document.querySelectorAll('[data-neighbor]').forEach(button => {
    button.addEventListener('click', () => selectState(button.dataset.neighbor));
  });
}

function moveTooltip(event) {
  const stage = document.querySelector('.map-stage').getBoundingClientRect();
  const tip = document.querySelector('#tooltip');

  tip.style.left = `${Math.min(event.clientX - stage.left + 14, stage.width - 230)}px`;
  tip.style.top = `${event.clientY - stage.top + 14}px`;
}

function bindMap() {
  svgDocument.querySelectorAll('.estado').forEach(path => {
    const uf = path.dataset.uf;

    // Configuração de Acessibilidade
    path.setAttribute('tabindex', '0');
    path.setAttribute('role', 'button');
    path.setAttribute('aria-label', `${STATES[uf]} (${uf})`);

    // Eventos do Mouse
    path.addEventListener('click', event => {
      event.preventDefault();
      selectState(uf);
    });
    path.addEventListener('mouseenter', e => showTooltip(e, uf));
    path.addEventListener('mousemove', moveTooltip);
    path.addEventListener('mouseleave', () => {
      document.querySelector('#tooltip').style.display = 'none';
    });
    path.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectState(uf);
      }
    });
  });
}

/* ==========================================================================
   5. INICIALIZAÇÃO
   ========================================================================== */

async function init() {
  const data = await loadGraph();
  
  graph = data.fronteiras;
  colors = data.coloracao || greedyColoring(graph);

  populateSelect();
  renderLegend();

  const map = document.querySelector('#brazilMap');
  
  map.addEventListener('load', () => {
    svgDocument = map.contentDocument;
    paintMap();
    bindMap();
  });

  // Eventos de Controles na Interface
  document.querySelector('#visualizeButton').addEventListener('click', () => {
    selectState(document.querySelector('#stateSelect').value);
  });

  document.querySelector('#stateSelect').addEventListener('change', e => {
    selectState(e.target.value);
  });
}

init();
