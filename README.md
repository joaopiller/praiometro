# Praiômetro

[![Backend](https://github.com/joaopiller/praiometro/actions/workflows/backend.yml/badge.svg)](https://github.com/joaopiller/praiometro/actions/workflows/backend.yml)
[![Frontend](https://github.com/joaopiller/praiometro/actions/workflows/frontend.yml/badge.svg)](https://github.com/joaopiller/praiometro/actions/workflows/frontend.yml)

App com informações das praias de Niterói (RJ): balneabilidade, ondas, vento, índice UV, previsão do tempo e avaliações dos banhistas, tudo em um só lugar.

O Praiômetro é um projeto de extensão da Universidade Federal Fluminense (UFF), desenvolvido por alunos de Sistemas de Informação.

![Telas do app](docs/screenshots/telas.png)

## Funcionalidades

- Mapa com os 29 pontos de coleta do INEA em Niterói
- Situação de cada praia: própria/imprópria para banho, data do boletim e histórico das últimas coletas
- Aviso quando choveu recentemente
- Praia mais próxima de você (no mapa e na lista)
- Ondas (nas praias oceânicas), vento, temperatura da água, índice UV e previsão para as próximas 24 horas
- Maré e nascer/pôr do sol
- Avaliação das praias pelos usuários (limpeza, acessibilidade, infraestrutura, segurança e tranquilidade), com meia estrela
- Relatos rápidos de quem está na praia (lotada, água-viva, mar agitado, bandeira vermelha...), que expiram em 5 horas
- Busca sem acento e filtro por praias próprias/impróprias
- Funciona offline com os últimos dados baixados

## Fontes de dados

| Dado | Fonte |
| --- | --- |
| Balneabilidade e histórico | Boletins do [INEA](https://www.inea.rj.gov.br/niteroi/) |
| Clima, ondas, maré, temperatura da água e sol | [Open-Meteo](https://open-meteo.com/) |
| Mapa | [OpenFreeMap](https://openfreemap.org/) + MapLibre (dados do OpenStreetMap) |

Limitações conhecidas:

- O boletim do INEA reflete as últimas coletas (cerca de duas por semana), não o dia de hoje.
- O modelo de ondas da Open-Meteo tem resolução de ~5 km e não representa o interior da Baía de Guanabara; por isso as praias da baía não exibem altura de onda.
- Maré e temperatura da água são previsões de modelo, não medições.

## Estrutura

```
praiometro/
├── backend/                 API (FastAPI) e worker de coleta (Python)
│   ├── praiometro/
│   │   ├── api/             rotas, schemas, cache e rate limit
│   │   ├── coleta/          Open-Meteo, INEA e consolidação dos dados
│   │   ├── dados/praias.json  catálogo fixo dos pontos de coleta
│   │   ├── avaliacoes.py    votos e médias (MongoDB)
│   │   └── worker.py        tarefas agendadas
│   ├── scripts/             utilitários de desenvolvimento
│   └── tests/
├── frontend/                app mobile (Expo / React Native + TypeScript)
│   ├── src/
│   │   ├── api/             cliente HTTP e tipos
│   │   ├── components/
│   │   ├── hooks/           consultas com React Query
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── theme/           cores, espaçamentos, tipografia
│   │   └── utils/
│   └── app.config.ts
├── docker-compose.yml       MongoDB + API + worker
└── .github/workflows/       CI/CD
```

## Backend

### Com Docker (recomendado)

```bash
cp backend/.env.example backend/.env   # ajuste o GOOGLE_CLIENT_ID
docker compose up -d --build
```

A API sobe em `http://localhost:8000` (documentação interativa em `/docs`). O worker faz a primeira coleta assim que inicia e depois repete a cada hora (o histórico do INEA é atualizado a cada 6 horas). Os arquivos gerados ficam na pasta definida por `DATA_DIR`.

### Sem Docker

Requer Python 3.11+ e um MongoDB rodando.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env

praiometro-worker   # coleta (deixe rodando)
praiometro-api      # API, em outro terminal
```

Para gerar avaliações falsas durante o desenvolvimento: `python scripts/popular_banco.py`.

### Testes

```bash
cd backend
pytest --cov
ruff check . && ruff format --check .
```

### Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Status da API e do MongoDB |
| GET | `/pontos` | Lista de pontos com a balneabilidade atual |
| GET | `/pontos/{codigo}` | Leitura atual e previsão de 24h |
| GET | `/pontos/{codigo}/dados?tipo=meteo\|marine\|ambos` | Apenas os indicadores |
| GET | `/pontos/{codigo}/avaliacao` | Médias das avaliações |
| GET | `/pontos/{codigo}/historico?dias=365` | Histórico de balneabilidade |
| GET | `/regiao` | Maré e nascer/pôr do sol |
| GET | `/pontos/{codigo}/relatos` | Relatos ativos, agrupados por tipo |
| POST | `/pontos/{codigo}/relatos` | Envia ou confirma um relato (exige login e estar a até 2 km da praia) |
| POST | `/pontos/{codigo}/relatos/{tipo}/denuncia` | Contesta um relato |
| POST | `/votar?praia_id=...` | Envia/atualiza uma avaliação (header `Authorization: Bearer <id_token do Google>`) |

### Moderação dos relatos

Os relatos são opções fixas, sem texto livre, então não há conteúdo ofensivo para moderar. Contra relatos falsos:

- cada relato expira em 5 horas (índice TTL no MongoDB);
- é preciso estar logado e a até 2 km da praia, verificado também no servidor;
- cada pessoa conta uma vez por tipo e praia a cada hora, com no máximo 5 relatos por dia;
- 3 contestações de pessoas diferentes escondem o relato, a menos que ele tenha mais confirmações do que contestações.

## Frontend

Requer Node 20+ e, para rodar no Android, Android Studio com JDK 17 ou 21.

```bash
cd frontend
npm install
npm run setup:env        # cria o .env apontando a API para o IP desta máquina
npm run android          # gera o projeto nativo e abre no emulador/celular
```

As configurações ficam no `.env` (veja `.env.example`):

- `EXPO_PUBLIC_API_URL`: endereço da API. No emulador, `http://10.0.2.2:8000` aponta para o seu computador.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: Web Client ID do Google, usado no login para avaliar praias.

A pasta `android/` é gerada a partir do `app.config.ts` (`npm run prebuild`), então não precisa ser editada à mão.

### Imagens

Scripts em `frontend/scripts/` (requerem Python com Pillow: `pip install pillow`):

- `python scripts/comprimir-imagens.py`: reduz as fotos de `assets/images/praias` para 1280 px de largura. Rode sempre que adicionar uma foto nova; ele não mexe no que já está otimizado.
- `python scripts/gerar-icones.py`: gera o ícone do app e o ícone adaptativo do Android a partir de `assets/images/logo-header.png`.
- `python scripts/gerar-pins.py`: gera os pins do mapa.

### Testes e qualidade

```bash
npm run typecheck
npm run lint
npm test
```

### Gerar APK

```bash
npm install -g eas-cli
eas build --platform android --profile preview
```

## CI/CD

- **Backend** (`.github/workflows/backend.yml`): lint, testes com cobertura e build da imagem Docker. Em pushes na `main`, a imagem é publicada no GitHub Container Registry.
- **Frontend** (`.github/workflows/frontend.yml`): typecheck, lint, testes e validação do bundle.
- **Release do app** (`.github/workflows/eas-build.yml`): build do APK pelo EAS, disparado manualmente ou por tags `v*`. Precisa do secret `EXPO_TOKEN`.

## Autoria

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Disklo" title="Rafael Lucio">
        <img src="https://avatars.githubusercontent.com/u/24628410?v=4" width="100px;" alt="Foto de perfil de Rafael"/><br>
        <sub><b>Disklo (Rafael Lucio)</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/joaopiller" title="João Vicente Piller">
        <img src="https://avatars.githubusercontent.com/u/174753035?v=4" width="100px;" alt="Foto de João"/><br>
        <sub><b>joaopiller (João Vicente Piller)</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/lucasilvr" title="Lucas Silveira">
        <img src="https://avatars.githubusercontent.com/u/128090148?v=4" width="100px;" alt="Foto de Lucas"/><br>
        <sub><b>lucasilvr (Lucas Silveira)</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/azevedxpam" title="Pâmella de Azevedo">
        <img src="https://avatars.githubusercontent.com/u/198846109?v=4" width="100px;" alt="Foto de Pâmella"/><br>
        <sub><b>azevedxpam (Pâmella de Azevedo)</b></sub>
      </a>
    </td>
  </tr>
</table>

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
