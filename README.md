# 🛡️ AegisAI - Made by Leonardo Hayashi rm573670, Enrico Lhano rm572958, Vitor de França rm569072 e Vitoria Araujo rm574189

### AI-Powered Application Security Posture Management

O **AegisAI** é uma plataforma de **Application Security Posture Management (ASPM)** integrada com **Inteligência Artificial**, desenvolvida para centralizar, normalizar, correlacionar e priorizar resultados de segurança provenientes de diferentes mecanismos de análise.

A plataforma recebe um repositório Git, executa ferramentas de segurança, consolida os findings, identifica ocorrências relacionadas, consulta o histórico de análises, calcula um Risk Score e utiliza Inteligência Artificial para auxiliar na interpretação dos riscos e geração de recomendações.

> **AegisAI não substitui as ferramentas de segurança. Ele atua como uma camada de centralização, correlação, priorização e inteligência sobre os resultados produzidos por elas.**

---

## 📌 Visão geral

O problema abordado pelo AegisAI é a fragmentação das informações de segurança durante o desenvolvimento de aplicações.

Em um ambiente real, diferentes ferramentas podem identificar diferentes tipos de problemas:

- SAST para análise do código-fonte;
- SCA para análise de dependências;
- DAST para análise de aplicações em execução;
- ferramentas especializadas para diferentes linguagens e tecnologias.

Esses resultados normalmente possuem formatos, severidades e estruturas diferentes.

O AegisAI busca centralizar esse processo em um único fluxo:

```text
                         ┌─────────────┐
                         │   Semgrep   │
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │   Bandit    │
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │    Trivy    │
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │  OWASP ZAP  │
                         └──────┬──────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Normalização   │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Correlação    │
                       │  Determinística │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Triage      │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Risk Engine   │
                       └────────┬────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
           ┌─────────────────┐     ┌─────────────────┐
           │ Historical      │     │ AI Security     │
           │ Correlation     │     │ Advisor         │
           └─────────────────┘     └─────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                ▼
                       ┌─────────────────┐
                       │    Dashboard    │
                       └─────────────────┘
🎯 Objetivos

O projeto tem como principais objetivos:

Centralizar resultados de diferentes ferramentas de segurança;
Integrar mecanismos de SAST, SCA e DAST;
Normalizar findings provenientes de diferentes scanners;
Identificar findings duplicados ou relacionados;
Criar fingerprints determinísticos;
Manter histórico das vulnerabilidades encontradas;
Auxiliar na triagem de vulnerabilidades;
Calcular um Risk Score;
Classificar o nível de risco;
Utilizar IA para análise e recomendação;
Correlacionar findings atuais com ocorrências históricas;
Apresentar os resultados em uma interface centralizada.
🏗️ Arquitetura

A arquitetura atual do AegisAI é organizada em diferentes camadas.

Git Repository
      │
      ▼
┌─────────────────────────┐
│ Scanner Orchestrator    │
└────────────┬────────────┘
             │
     ┌───────┼────────┬─────────┐
     ▼       ▼        ▼         ▼
  Semgrep  Bandit   Trivy      ZAP
   SAST     SAST     SCA       DAST
     │       │        │         │
     └───────┴────────┴─────────┘
             │
             ▼
┌─────────────────────────┐
│ Normalization Engine    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Correlation Engine      │
│ Fingerprint             │
│ Deduplication           │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Historical Correlation  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ AI Correlation          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Triage                  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Risk Engine             │
└────────────┬────────────┘
             │
             ├──────────────────┐
             ▼                  ▼
      ┌──────────────┐   ┌──────────────┐
      │ SQLite       │   │ AI Advisor   │
      └──────────────┘   └──────────────┘
             │                  │
             └────────┬─────────┘
                      ▼
              ┌──────────────┐
              │  Dashboard   │
              └──────────────┘
🔍 Scanners
Semgrep

O Semgrep é utilizado como mecanismo de SAST (Static Application Security Testing).

Ele analisa o código-fonte em busca de padrões associados a problemas de segurança.

O resultado é normalizado pelo AegisAI antes de ser encaminhado para as demais etapas do pipeline.

Tipo
SAST
Bandit

O Bandit é utilizado para análise de segurança de aplicações Python.

Ele identifica padrões potencialmente inseguros no código Python e seus resultados são convertidos para o modelo unificado de findings do AegisAI.

Tipo
SAST
Comportamento

Quando o repositório não possui arquivos Python relevantes, o scanner pode ser marcado como:

skipped

Caso o executável não esteja disponível no ambiente:

SCANNER_UNAVAILABLE

A indisponibilidade do Bandit não interrompe necessariamente a análise dos demais scanners.

Trivy

O Trivy é utilizado principalmente para SCA (Software Composition Analysis).

Ele permite analisar dependências e identificar vulnerabilidades conhecidas em componentes utilizados pela aplicação.

Entre os dados preservados pelo AegisAI estão:

pacote;
versão;
versão corrigida;
CVE;
título;
descrição;
severidade.
Tipo
SCA

O scanner reconhece arquivos de dependência como, por exemplo:

package.json
package-lock.json
requirements.txt
poetry.lock
pom.xml
build.gradle
OWASP ZAP

O OWASP ZAP (Zed Attack Proxy) é utilizado como mecanismo de DAST (Dynamic Application Security Testing).

Diferentemente de SAST e SCA, o DAST exige uma aplicação em execução que possa ser analisada.

Por isso, o AegisAI trabalha com um targetUrl explícito para o scanner.

Tipo
DAST

O resultado pode preservar informações como:

alerta;
risco;
confiança;
URL;
método HTTP;
evidência;
descrição;
solução;
referência;
CWE;
WASC;
plugin.

Quando um alvo DAST não é fornecido, o scanner pode ser marcado como:

skipped

A utilização do ZAP depende de uma aplicação-alvo acessível durante a análise.

🔄 Scanner Orchestrator

O Scanner Orchestrator é responsável por coordenar os scanners disponíveis.

Em vez de o sistema depender diretamente de um único scanner, cada ferramenta possui seu próprio resultado.

Exemplo conceitual:

{
  "scanner": "Semgrep",
  "type": "SAST",
  "status": "completed",
  "findingCount": 12
}

Os estados utilizados pelo pipeline incluem:

pending
running
completed
skipped
failed
unavailable

Isso permite que uma ferramenta apresente uma falha sem necessariamente interromper toda a análise.

🧩 Normalização

Cada ferramenta possui seu próprio formato de saída.

Por exemplo:

Semgrep → JSON específico
Bandit  → JSON específico
Trivy   → JSON específico
ZAP     → JSON específico

O Normalization Engine transforma esses formatos em uma estrutura comum.

O objetivo é permitir que as etapas posteriores trabalhem com um modelo unificado.

Um finding pode conter informações como:

scanner
type
title
description
severity
confidence
file
line
endpoint
method
package
version
fixedVersion
rule
CVE
CWE
fingerprint
🔗 Fingerprint

Cada finding pode receber um fingerprint determinístico.

O fingerprint permite identificar ocorrências relacionadas e evitar que o mesmo problema seja tratado como vulnerabilidades completamente independentes.

Conceitualmente:

Finding A
   │
   ├── mesmo fingerprint
   │
Finding B
   │
   ▼
Finding correlacionado

Isso também possibilita acompanhar uma vulnerabilidade ao longo de diferentes análises.

🔄 Correlação Determinística

A correlação determinística é executada antes das funcionalidades de Inteligência Artificial.

Ela utiliza sinais objetivos, como:

fingerprint;
scanner;
tipo;
regra;
localização;
características do finding.

O processo permite separar:

Raw Findings

de:

Unique Findings

Por exemplo:

Scanner A → Finding X
Scanner B → Finding X
Scanner C → Finding Y

Raw Findings = 3

Após correlação:

Finding X
Finding Y

Unique Findings = 2
🕒 Historical Correlation

O AegisAI possui uma camada de Historical Correlation responsável por consultar resultados de análises anteriores armazenados no banco de dados.

O objetivo é verificar se um finding atual possui relação com ocorrências anteriores.

Fluxo:

Finding atual
      │
      ▼
Consulta histórico
      │
      ▼
Candidatos relevantes
      │
      ▼
Similarity / sinais
      │
      ▼
Historical Correlation

A busca pode considerar informações como:

fingerprint;
scanner;
tipo;
severidade;
regra;
CWE;
CVE;
arquivo;
endpoint;
método;
pacote;
mensagem normalizada.

O número de candidatos históricos é limitado para evitar consultas excessivas.

A configuração padrão utiliza:

HISTORICAL_CORRELATION_LIMIT=20

com limite máximo configurado pelo sistema.

🤖 AI Correlation

A AI Correlation utiliza um modelo de linguagem para auxiliar na análise dos candidatos históricos.

A IA recebe apenas candidatos relevantes identificados pelo mecanismo anterior, em vez de analisar todo o banco de dados.

O retorno esperado segue uma estrutura semelhante a:

{
  "correlated": true,
  "confidence": 0.8,
  "relatedFindings": [7],
  "reason": "Same rule",
  "signals": []
}

A IA funciona como uma camada de apoio.

A AI Correlation não altera automaticamente:
severidade;
Risk Score;
Risk Level;
triagem;
persistência;
findings.

Caso o serviço de IA esteja indisponível, apresente timeout ou retorne JSON inválido, a análise técnica continua.

Estados possíveis:

completed
skipped
unavailable
🧠 Triage

O AegisAI possui uma camada de triagem para representar o tratamento dos findings.

Estados suportados incluem:

NEW
NEEDS_REVIEW
CONFIRMED
FALSE_POSITIVE
ACCEPTED_RISK
SUPPRESSED

A triagem pode armazenar informações como:

status;
confiança;
motivo;
criação;
atualização.

A existência da camada de triagem permite separar:

Scanner encontrou um possível problema
                ↓
             Finding
                ↓
              Triage
                ↓
     Decisão de tratamento

A arquitetura evita que a IA altere automaticamente a classificação técnica de uma vulnerabilidade.

📊 Risk Engine

O Risk Engine é responsável pela priorização dos riscos identificados.

Ele recebe os findings consolidados e calcula:

Risk Score
Risk Level
Top Risks

O Risk Score é utilizado pelo frontend para apresentar a postura de segurança da aplicação.

A classificação pode ser apresentada através de níveis como:

LOW
MEDIUM
HIGH
CRITICAL

O Risk Engine foi integrado ao pipeline de múltiplos scanners sem eliminar o comportamento existente do sistema.

🤖 AI Security Advisor

O AI Security Advisor utiliza Inteligência Artificial para auxiliar na interpretação dos resultados.

A resposta pode incluir:

resumo da análise;
nível de risco;
prioridade;
principais riscos;
recomendações;
quantidade de findings analisados.

Exemplo conceitual:

{
  "success": true,
  "data": {
    "summary": "...",
    "riskLevel": "HIGH",
    "priority": "HIGH",
    "keyRisks": [],
    "recommendations": [],
    "findingsAnalyzed": 20
  }
}

A IA tem como objetivo:

Transformar resultados técnicos em informações mais compreensíveis e acionáveis.

💾 Persistência

O AegisAI utiliza SQLite para persistência local.

Entre as informações armazenadas estão dados relacionados a:

repositórios;
scans;
vulnerabilidades;
findings;
informações utilizadas para correlação histórica;
triagem.

A persistência permite que novas análises possam utilizar informações de análises anteriores.

🌐 API

A principal operação de análise é:

POST /api/analyze
Request
{
  "repoUrl": "https://github.com/usuario/repositorio"
}
Exemplo de resposta
{
  "success": true,
  "scanId": 30,
  "riskScore": 45,
  "riskLevel": "LOW",
  "totalFindings": 1,
  "rawFindingCount": 1,
  "uniqueFindingCount": 1,
  "scannerResults": [],
  "historicalCorrelation": {
    "status": "completed",
    "matches": []
  },
  "aiCorrelation": {
    "status": "skipped",
    "matches": []
  },
  "findings": [],
  "uniqueFindings": [],
  "topRisks": [],
  "aiAdvisor": {}
}

Os campos de correlação são aditivos e não substituem os campos legados da API.

📡 Estados da API
Historical Correlation

Estados possíveis:

completed
no_matches
unavailable
AI Correlation

Estados possíveis:

completed
skipped
unavailable

A indisponibilidade dessas funcionalidades não deve impedir que a análise técnica principal seja concluída.

🖥️ Frontend

O frontend foi desenvolvido utilizando:

React;
TypeScript;
Vite;
Tailwind CSS;
Lucide React;
React Router;
Recharts;
Axios.

A interface possui uma identidade visual baseada em:

tema escuro;
elementos roxos;
cards;
indicadores de risco;
tabelas;
gráficos;
status dos scanners.
📊 Dashboard

O Dashboard apresenta a postura de segurança da aplicação.

Entre as informações apresentadas estão:

Risk Score;
Risk Level;
quantidade de findings;
postura de segurança;
histórico de análises;
status de componentes;
repositórios registrados;
última análise.

O objetivo é fornecer uma visão centralizada da situação de segurança dos repositórios analisados.

🔎 New Analysis

A tela New Analysis permite iniciar uma nova análise informando a URL de um repositório Git público.

Fluxo:

Repository URL
      ↓
Clone
      ↓
Security Analysis
      ↓
Scanner Results
      ↓
Correlation
      ↓
Risk Analysis
      ↓
AI Advisor
      ↓
Results

A interface apresenta informações como:

Scan ID;
Risk Score;
Risk Level;
quantidade de findings;
status dos scanners;
correlação histórica;
AI Correlation;
tabela unificada de findings;
recomendações da IA.
📋 Unified Findings Table

Os resultados de diferentes scanners podem ser apresentados em uma tabela unificada.

Dependendo do scanner, podem ser exibidos:

Campo	Descrição
Scanner	Ferramenta que produziu o finding
Type	SAST, SCA ou DAST
Severity	Severidade normalizada
Rule / CVE	Regra ou vulnerabilidade identificada
Description	Descrição do problema
File	Arquivo afetado
Line	Linha afetada
Endpoint	Endpoint analisado
Method	Método HTTP
Package	Dependência afetada
Version	Versão atual
Fixed Version	Versão corrigida
🧪 Testes

O backend possui uma suíte de testes automatizados cobrindo diferentes partes da arquitetura.

Entre os componentes testados estão:

scanners;
normalização;
fingerprints;
correlação;
histórico;
triagem;
AI Correlation;
Risk Engine;
pipeline de análise.

Na última validação do projeto:

41/41 testes aprovados
🛠️ Tecnologias
Backend
Node.js
Express
JavaScript
SQLite
Simple Git
Ollama
UUID
CORS
fs-extra
Frontend
React
TypeScript
Vite
Tailwind CSS
Lucide React
React Router
Recharts
Axios
Segurança
Semgrep
Bandit
Trivy
OWASP ZAP
Inteligência Artificial
LLM através da integração com Ollama
AI Security Advisor
AI Correlation
📁 Estrutura do projeto

A estrutura pode ser organizada aproximadamente da seguinte maneira:

aegis-ai/
│
├── backend/
│   │
│   ├── src/
│   │   ├── engines/
│   │   │   └── risk/
│   │   │
│   │   ├── repositories/
│   │   │
│   │   ├── routes/
│   │   │
│   │   ├── scanners/
│   │   │   ├── semgrepScanner.js
│   │   │   ├── banditScanner.js
│   │   │   ├── trivyScanner.js
│   │   │   └── zapScanner.js
│   │   │
│   │   ├── services/
│   │   │   ├── analysisService.js
│   │   │   ├── scannerOrchestrator.js
│   │   │   ├── historicalCorrelationService.js
│   │   │   ├── aiCorrelationService.js
│   │   │   └── aiAdvisorService.js
│   │   │
│   │   └── ...
│   │
│   ├── database/
│   │
│   ├── fixtures/
│   │
│   ├── aegis.test.js
│   ├── package.json
│   └── ...
│
├── frontend/
│   │
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── analysis/
│   │   │   └── layout/
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   └── NewAnalysis/
│   │   │
│   │   ├── types/
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
└── README.md
🚀 Instalação
Pré-requisitos

Para executar o AegisAI localmente, é necessário possuir:

Node.js;
npm;
Git;
Semgrep;
Bandit para análise Python;
Trivy para SCA;
OWASP ZAP para DAST;
acesso/configuração do serviço de IA utilizado pelo projeto.

Alguns scanners são opcionais dependendo do tipo de repositório analisado.

📦 Backend

Entre no diretório:

cd backend

Instale as dependências:

npm install

Execute o backend:

npm start

O backend é executado através do:

src/server.js
💻 Frontend

Em outro terminal:

cd frontend

Instale as dependências:

npm install

Execute o ambiente de desenvolvimento:

npm run dev

O Vite disponibilizará a aplicação em um endereço local, normalmente:

http://localhost:5173

O backend normalmente utiliza:

http://localhost:3000
🧪 Executando os testes

No backend:

cd backend
npm test

O projeto atualmente possui uma suíte automatizada para validação do pipeline.

🏗️ Build do frontend

Execute:

cd frontend
npm run build

O processo de build também executa a verificação TypeScript na configuração atual do projeto.

Para verificar apenas o TypeScript:

npx tsc -b
🔌 Testando a API

Com o backend em execução:

POST http://localhost:3000/api/analyze

Header:

Content-Type: application/json

Body:

{
  "repoUrl": "https://github.com/usuario/repositorio"
}
⚙️ Configuração da Inteligência Artificial

O projeto utiliza integração com Ollama para funcionalidades relacionadas à IA.

Existem configurações específicas para os serviços de IA.

Entre elas estão configurações relacionadas a:

OLLAMA_CORRELATION_MODEL
OLLAMA_CORRELATION_TIMEOUT

Também pode existir configuração de modelo utilizada pelo AI Security Advisor.

Recomenda-se configurar essas variáveis através de um arquivo .env local quando aplicável.

Não versionar tokens, chaves de API ou credenciais no GitHub.

🔐 Segurança

O AegisAI é uma ferramenta de análise de segurança e deve ser utilizado somente em ambientes e repositórios para os quais o usuário possui autorização.

Especialmente para DAST com OWASP ZAP:

utilize aplicações de laboratório;
utilize aplicações próprias;
evite realizar scans em sistemas de terceiros sem autorização;
mantenha o targetUrl sob controle do usuário.
🧭 Fluxo completo de uma análise

O fluxo atual pode ser resumido da seguinte forma:

1. Usuário informa o repositório
             ↓
2. Repositório é clonado
             ↓
3. Scanner Orchestrator inicia as ferramentas
             ↓
4. Semgrep / Bandit / Trivy / ZAP
             ↓
5. Findings são normalizados
             ↓
6. Fingerprints são calculados
             ↓
7. Correlação determinística
             ↓
8. Findings históricos são consultados
             ↓
9. AI Correlation auxilia a análise
             ↓
10. Triage
             ↓
11. Risk Engine calcula o risco
             ↓
12. Resultados são persistidos
             ↓
13. AI Security Advisor gera recomendações
             ↓
14. Frontend apresenta os resultados
🔁 Resiliência do pipeline

Um dos princípios do AegisAI é evitar que uma funcionalidade opcional derrube toda a análise.

Por exemplo:

Semgrep       → completed
Bandit        → completed
Trivy         → completed
ZAP           → skipped
Historical    → completed
AI Correlation→ unavailable
AI Advisor    → completed
Risk Engine   → completed

Mesmo com uma funcionalidade indisponível, os resultados técnicos disponíveis continuam podendo ser processados.

📈 Evolução do projeto
Sprint 3

A plataforma possuía principalmente:

Repository
    ↓
Semgrep
    ↓
Risk Engine
    ↓
AI Security Advisor
    ↓
Dashboard
Sprint 4

A arquitetura evoluiu para:

Semgrep ─┐
Bandit ──┤
Trivy ───┤
ZAP ─────┘
    ↓
Normalization
    ↓
Correlation
    ↓
Historical Correlation
    ↓
AI Correlation
    ↓
Triage
    ↓
Risk Engine
    ↓
AI Security Advisor
    ↓
Dashboard

As principais evoluções foram:

integração de múltiplos scanners;
SAST com Semgrep e Bandit;
SCA com Trivy;
integração DAST com OWASP ZAP;
normalização de findings;
fingerprints determinísticos;
correlação de findings;
Historical Correlation;
AI Correlation;
triagem;
evolução do Risk Engine;
persistência de histórico;
tabela unificada de vulnerabilidades;
integração mais ampla da IA;
testes automatizados.
🎯 Diferencial do AegisAI

O diferencial do projeto não está simplesmente em executar scanners.

Ferramentas como SAST, SCA e DAST já existem individualmente.

A proposta do AegisAI é atuar como uma camada de Application Security Posture Management, centralizando essas informações e adicionando:

Centralização
      +
Normalização
      +
Correlação
      +
Histórico
      +
Triagem
      +
Risk Intelligence
      +
Inteligência Artificial

Assim, o sistema busca responder não apenas:

"Qual vulnerabilidade foi encontrada?"

mas também:

"Quais findings estão relacionados?"

"Esse problema já apareceu anteriormente?"

"Qual é o risco consolidado?"

"Quais problemas devem receber atenção?"

"Como a IA pode ajudar a interpretar os resultados?"

⚠️ Limitações atuais

O AegisAI ainda é um projeto acadêmico/MVP e possui algumas limitações.

Entre elas:

a disponibilidade dos scanners depende do ambiente de execução;
DAST exige uma aplicação-alvo acessível;
a qualidade das recomendações da IA depende do modelo configurado;
AI Correlation é uma camada de apoio e não uma decisão automatizada;
o sistema não pretende substituir ferramentas especializadas;
nem todos os controles de segurança de um programa completo de AppSec/ASPM são implementados;
o build do frontend pode depender da compatibilidade do ambiente com binários nativos do Tailwind.
🔮 Possíveis evoluções

Algumas evoluções futuras podem incluir:

maior cobertura de scanners;
integração de novos mecanismos de SAST, SCA e DAST;
suporte a mais linguagens;
melhoria da correlação semântica;
embeddings para busca de similaridade;
RAG para contexto de vulnerabilidades;
AI Triage;
geração assistida de planos de remediação;
integração com sistemas de tickets;
integração com CI/CD;
criação de políticas de segurança;
histórico e tendências mais avançadas;
notificações e alertas;
controles de acesso e autenticação;
PostgreSQL para ambientes maiores;
execução distribuída dos scanners.
👥 Equipe

AegisAI Team

Projeto acadêmico desenvolvido no contexto do FIAP Challenge.

A equipe trabalha de forma colaborativa nas áreas de:

Backend;
Frontend;
Cybersecurity;
Integração de scanners;
Risk Intelligence;
Inteligência Artificial;
Banco de dados;
UX/UI;
Documentação e apresentação.
🎓 Contexto acadêmico

O AegisAI foi desenvolvido como projeto acadêmico com o objetivo de aplicar conceitos de:

Cybersecurity;
Application Security;
ASPM;
SAST;
SCA;
DAST;
Risk Management;
Inteligência Artificial;
Desenvolvimento Web;
Engenharia de Software.
📚 Conceitos utilizados

Durante o desenvolvimento foram aplicados conceitos relacionados a:

Application Security

Segurança integrada ao ciclo de desenvolvimento de aplicações.

ASPM

Centralização e gerenciamento da postura de segurança de aplicações.

SAST

Análise estática do código-fonte.

SCA

Análise de dependências e componentes de terceiros.

DAST

Análise dinâmica de aplicações em execução.

Risk Intelligence

Processamento e priorização dos resultados de segurança para auxiliar na tomada de decisão.

Security Findings

Representação padronizada dos problemas identificados pelas ferramentas.

Correlation

Identificação de relações entre diferentes findings.

Triage

Classificação e tratamento dos findings identificados.

📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.

Caso uma licença específica seja adicionada ao repositório, esta seção deverá ser atualizada de acordo com os termos definidos pela equipe.

🛡️ AegisAI

Detect. Correlate. Prioritize. Protect.

Uma plataforma acadêmica de Application Security Posture Management que combina múltiplas fontes de segurança, Risk Intelligence e Inteligência Artificial para transformar findings técnicos em uma visão centralizada de risco.
