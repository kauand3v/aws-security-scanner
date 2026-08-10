<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-blue.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT">
  <img src="https://img.shields.io/badge/tests-pytest-brightgreen.svg" alt="Tests pytest">
  <img src="https://img.shields.io/badge/coverage-85%25-yellowgreen.svg" alt="Coverage 85%">
  <img src="https://img.shields.io/badge/AWS-boto3-orange.svg" alt="AWS boto3">
  <img src="https://img.shields.io/badge/LocalStack-ready-purple.svg" alt="LocalStack ready">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<p align="center">
  <h1 align="center"> aws-security-scanner</h1>
  <p align="center">Ferramenta CLI assíncrona para identificar configurações de segurança incorretas na AWS.<br>
  <em>Asynchronous CLI tool to identify misconfigured security settings in AWS.</em></p>
</p>

---

## 📚 Sumário | Table of Contents

- [Português](#português)
  - [📖 Sobre o Projeto](#-sobre-o-projeto)
  - [🧰 Funcionalidades](#-funcionalidades)
  - [🧱 Arquitetura e Diagramas](#-arquitetura-e-diagramas)
  - [🚀 Como Começar](#-como-começar)
  - [🧪 Testes](#-testes)
  - [📊 Relatórios](#-relatórios)
  - [📂 Estrutura do Projeto](#-estrutura-do-projeto)
  - [🤝 Contribuindo](#-contribuindo)
  - [📄 Licença](#-licença)
- [English](#english)
  - [📖 About the Project](#-about-the-project)
  - [🧰 Features](#-features)
  - [🧱 Architecture & Diagrams](#-architecture--diagrams)
  - [🚀 Getting Started](#-getting-started)
  - [🧪 Testing](#-testing)
  - [📊 Reports](#-reports)
  - [📂 Project Structure](#-project-structure)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

---

# Português

## 📖 Sobre o Projeto

O **aws-security-scanner** é uma ferramenta de linha de comando (CLI) desenvolvida em Python que escaneia automaticamente sua conta AWS (ou uma simulação local com [LocalStack](https://localstack.cloud/)) em busca de configurações de segurança inadequadas e arriscadas.

Ele verifica:

- **Security Groups** com portas abertas para o mundo (`0.0.0.0/0`), como SSH (22) e RDP (3389).
- **Buckets S3** com acesso público indevido.
- **Políticas IAM** excessivamente permissivas (ex.: `"Action": "*"`, `"Resource": "*"`).

Ao final, gera um relatório em **JSON** e **HTML** com todas as não-conformidades encontradas, pronto para ser usado em auditorias ou integrado a pipelines de CI/CD.

## 🧰 Funcionalidades

- ✅ Escaneamento concorrente com `asyncio` e `aioboto3` – performance mesmo em contas grandes.
- ✅ Checks modulares: Security Groups, S3 Buckets e IAM Policies.
- ✅ Relatórios detalhados em JSON e HTML (template Jinja2).
- ✅ Suporte a ambientes reais AWS e ao simulador LocalStack.
- ✅ Testes unitários com `pytest` e `moto` (mock completo da AWS).
- ✅ Testes de integração com LocalStack via Docker.
- ✅ Cobertura de código >80%.
- ✅ Configuração simples via variáveis de ambiente ou `.env`.

## 🧱 Arquitetura e Diagramas

### Diagrama de Fluxo da Execução

```mermaid
graph TD
    A[Usuário / CI Pipeline] -->|invoca| B(CLI: python -m aws_security_scanner)
    B --> C{AWSSecurityScanner}
    C -->|async gather| D[SecurityGroupCheck]
    C -->|async gather| E[S3BucketCheck]
    C -->|async gather| F[IAMPolicyCheck]
    D --> G[(AWS API / LocalStack)]
    E --> G
    F --> G
    G -->|retorna dados| D
    G -->|retorna dados| E
    G -->|retorna dados| F
    D --> H[Lista de Findings]
    E --> H
    F --> H
    H --> I[Repórter JSON]
    H --> J[Repórter HTML]
    I --> K[Relatório JSON]
    J --> L[Relatório HTML]
```

### Diagrama de Classes (simplificado)

```mermaid
classDiagram
    class BaseCheck {
        <<abstract>>
        +run(session) List~Dict~
    }
    class SecurityGroupCheck {
        +run(session) List~Dict~
    }
    class S3BucketCheck {
        +run(session) List~Dict~
    }
    class IAMPolicyCheck {
        +run(session) List~Dict~
    }
    class AWSSecurityScanner {
        -session: aioboto3.Session
        +scan() dict
    }
    class JSONReporter {
        +generate(findings) str
    }
    class HTMLReporter {
        +generate(findings) str
    }

    BaseCheck <|-- SecurityGroupCheck
    BaseCheck <|-- S3BucketCheck
    BaseCheck <|-- IAMPolicyCheck
    AWSSecurityScanner --> BaseCheck : executa
    AWSSecurityScanner --> JSONReporter : usa
    AWSSecurityScanner --> HTMLReporter : usa
```

## 🚀 Como Começar

### Pré-requisitos

- Python 3.10+
- Docker e Docker Compose (apenas para testes com LocalStack)
- Credenciais AWS configuradas (opcional, apenas para scans reais)

### Instalação

```bash
git clone https://github.com/seu-usuario/aws-security-scanner.git
cd aws-security-scanner
python -m venv venv
source venv/bin/activate      # Linux/macOS
venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

### Configuração

Crie um arquivo `.env` baseado no `.env.example`:

```ini
# Para usar LocalStack (ambiente local)
AWS_ENDPOINT_URL=http://localhost:4566
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=fake
AWS_SECRET_ACCESS_KEY=fake
```

Para escanear uma conta real da AWS, deixe as variáveis comentadas e configure suas credenciais padrão (`~/.aws/credentials` ou variáveis de ambiente `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`).

### Executando

```bash
# Scan local com LocalStack (inicie o LocalStack primeiro, veja abaixo)
python -m aws_security_scanner --region us-east-1 --format json

# Formato HTML
python -m aws_security_scanner --region us-east-1 --format html > report.html
```

#### Iniciando LocalStack (para testes locais)

```bash
docker-compose up -d
```

O `docker-compose.yml` já provisiona os serviços EC2, S3 e IAM na porta 4566.

## 🧪 Testes

O projeto possui dois níveis de testes:

### Testes unitários (com `moto`)

Mockam completamente a AWS, sem necessidade de rede ou contêineres.

```bash
pytest tests/ -v
```

### Testes de integração (com LocalStack)

Exigem o LocalStack rodando (`docker-compose up -d`).

```bash
pytest tests/ --integration -v
```

### Cobertura de código

```bash
pytest --cov=src --cov-report=term-missing --cov-report=html
```

Abra `htmlcov/index.html` no navegador para ver o relatório detalhado.

## 📊 Relatórios

### Exemplo de saída JSON

```json
{
  "scan_date": "2026-08-10T14:30:00",
  "total_risks": 2,
  "findings": [
    {
      "resource_type": "SecurityGroup",
      "resource_id": "sg-0a1b2c3d4e5f",
      "risk": "HIGH",
      "detail": "Port 22 open to world"
    },
    {
      "resource_type": "S3Bucket",
      "resource_id": "meu-bucket-publico",
      "risk": "CRITICAL",
      "detail": "Bucket has public read access"
    }
  ]
}
```

### Relatório HTML

O relatório HTML utiliza um template Jinja2 responsivo, com tabela colorida por nível de risco (CRITICAL, HIGH, MEDIUM) e timestamp da varredura.

*(Exemplo de screenshot – você pode adicionar uma imagem real mais tarde)*
![Relatório HTML](docs/report_sample.png)

## 📂 Estrutura do Projeto

```
aws-security-scanner/
├── README.md                # Este arquivo
├── pyproject.toml           # Metadados e ferramentas
├── requirements.txt         # Dependências
├── Makefile                 # Comandos úteis
├── docker-compose.yml       # LocalStack
├── .env.example
├── src/
│   ├── __init__.py
│   ├── __main__.py          # Ponto de entrada da CLI
│   ├── scanner.py           # Orquestrador dos checks
│   ├── checks/
│   │   ├── __init__.py
│   │   ├── base.py          # Classe base abstrata
│   │   ├── security_groups.py
│   │   ├── s3_buckets.py
│   │   └── iam_policies.py
│   ├── reporters/
│   │   ├── __init__.py
│   │   ├── json_reporter.py
│   │   └── html_reporter.py
│   └── utils/
│       ├── __init__.py
│       └── aws_client.py    # Fábrica de clientes boto3
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Fixtures compartilhadas
│   ├── test_security_groups.py
│   ├── test_s3_buckets.py
│   └── test_iam_policies.py
└── docs/
    └── report_sample.png
```

## 🤝 Contribuindo

Contribuições são muito bem-vindas!  
Por favor, abra uma issue para discutir novas ideias ou envie um pull request.  
Certifique-se de que os testes passam e de que a cobertura se mantém acima de 80%.

```bash
# Rodar todos os testes e verificar estilo
make test
make lint
```

## 📄 Licença

Este projeto está licenciado sob a Licença MIT – veja o arquivo [LICENSE](LICENSE) para detalhes.

---

# English

## 📖 About the Project

**aws-security-scanner** is a command-line tool (CLI) built in Python that automatically scans your AWS account (or a local simulation using [LocalStack](https://localstack.cloud/)) for insecure and risky security configurations.

It checks for:

- **Security Groups** with ports open to the world (`0.0.0.0/0`), such as SSH (22) and RDP (3389).
- **S3 Buckets** with inappropriate public access.
- **IAM Policies** that are overly permissive (e.g., `"Action": "*"`, `"Resource": "*"`).

At the end, it generates a **JSON** and **HTML** report with all non-compliant findings, ready for audits or integration into CI/CD pipelines.

## 🧰 Features

- ✅ Concurrent scanning with `asyncio` and `aioboto3` – high performance even in large accounts.
- ✅ Modular checks: Security Groups, S3 Buckets, and IAM Policies.
- ✅ Detailed reports in JSON and HTML (Jinja2 templates).
- ✅ Support for real AWS environments and LocalStack simulator.
- ✅ Unit tests with `pytest` and `moto` (full AWS mocking).
- ✅ Integration tests with LocalStack via Docker.
- ✅ Code coverage >80%.
- ✅ Simple configuration via environment variables or `.env`.

## 🧱 Architecture & Diagrams

### Execution Flow Diagram

```mermaid
graph TD
    A[User / CI Pipeline] -->|invokes| B(CLI: python -m aws_security_scanner)
    B --> C{AWSSecurityScanner}
    C -->|async gather| D[SecurityGroupCheck]
    C -->|async gather| E[S3BucketCheck]
    C -->|async gather| F[IAMPolicyCheck]
    D --> G[(AWS API / LocalStack)]
    E --> G
    F --> G
    G -->|returns data| D
    G -->|returns data| E
    G -->|returns data| F
    D --> H[List of Findings]
    E --> H
    F --> H
    H --> I[JSON Reporter]
    H --> J[HTML Reporter]
    I --> K[JSON Report]
    J --> L[HTML Report]
```

### Simplified Class Diagram

```mermaid
classDiagram
    class BaseCheck {
        <<abstract>>
        +run(session) List~Dict~
    }
    class SecurityGroupCheck {
        +run(session) List~Dict~
    }
    class S3BucketCheck {
        +run(session) List~Dict~
    }
    class IAMPolicyCheck {
        +run(session) List~Dict~
    }
    class AWSSecurityScanner {
        -session: aioboto3.Session
        +scan() dict
    }
    class JSONReporter {
        +generate(findings) str
    }
    class HTMLReporter {
        +generate(findings) str
    }

    BaseCheck <|-- SecurityGroupCheck
    BaseCheck <|-- S3BucketCheck
    BaseCheck <|-- IAMPolicyCheck
    AWSSecurityScanner --> BaseCheck : runs
    AWSSecurityScanner --> JSONReporter : uses
    AWSSecurityScanner --> HTMLReporter : uses
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Docker and Docker Compose (only for LocalStack tests)
- AWS credentials configured (optional, for real scans only)

### Installation

```bash
git clone https://github.com/your-user/aws-security-scanner.git
cd aws-security-scanner
python -m venv venv
source venv/bin/activate      # Linux/macOS
venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

### Configuration

Create a `.env` file based on `.env.example`:

```ini
# For LocalStack (local environment)
AWS_ENDPOINT_URL=http://localhost:4566
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=fake
AWS_SECRET_ACCESS_KEY=fake
```

To scan a real AWS account, comment out those variables and set up your default credentials (`~/.aws/credentials` or environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`).

### Running

```bash
# Local scan with LocalStack (start LocalStack first, see below)
python -m aws_security_scanner --region us-east-1 --format json

# HTML format
python -m aws_security_scanner --region us-east-1 --format html > report.html
```

#### Starting LocalStack (for local tests)

```bash
docker-compose up -d
```

The included `docker-compose.yml` provisions EC2, S3 and IAM on port 4566.

## 🧪 Testing

The project has two levels of tests:

### Unit tests (with `moto`)

Mock all AWS APIs – no network or containers needed.

```bash
pytest tests/ -v
```

### Integration tests (with LocalStack)

Require LocalStack running (`docker-compose up -d`).

```bash
pytest tests/ --integration -v
```

### Code coverage

```bash
pytest --cov=src --cov-report=term-missing --cov-report=html
```

Open `htmlcov/index.html` in your browser for a detailed report.

## 📊 Reports

### Sample JSON output

```json
{
  "scan_date": "2026-08-10T14:30:00",
  "total_risks": 2,
  "findings": [
    {
      "resource_type": "SecurityGroup",
      "resource_id": "sg-0a1b2c3d4e5f",
      "risk": "HIGH",
      "detail": "Port 22 open to world"
    },
    {
      "resource_type": "S3Bucket",
      "resource_id": "my-public-bucket",
      "risk": "CRITICAL",
      "detail": "Bucket has public read access"
    }
  ]
}
```

### HTML Report

The HTML report uses a responsive Jinja2 template, with a color-coded table by risk level (CRITICAL, HIGH, MEDIUM) and scan timestamp.

*(Screenshot placeholder – you can add a real image later)*
![HTML Report](docs/report_sample.png)

## 📂 Project Structure

```
aws-security-scanner/
├── README.md                # This file
├── pyproject.toml           # Metadata and tools
├── requirements.txt         # Dependencies
├── Makefile                 # Useful commands
├── docker-compose.yml       # LocalStack
├── .env.example
├── src/
│   ├── __init__.py
│   ├── __main__.py          # CLI entry point
│   ├── scanner.py           # Check orchestrator
│   ├── checks/
│   │   ├── __init__.py
│   │   ├── base.py          # Abstract base class
│   │   ├── security_groups.py
│   │   ├── s3_buckets.py
│   │   └── iam_policies.py
│   ├── reporters/
│   │   ├── __init__.py
│   │   ├── json_reporter.py
│   │   └── html_reporter.py
│   └── utils/
│       ├── __init__.py
│       └── aws_client.py    # boto3 client factory
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Shared fixtures
│   ├── test_security_groups.py
│   ├── test_s3_buckets.py
│   └── test_iam_policies.py
└── docs/
    └── report_sample.png
```

## 🤝 Contributing

Contributions are very welcome!  
Please open an issue to discuss new ideas or submit a pull request.  
Make sure all tests pass and coverage stays above 80%.

```bash
# Run all tests and check style
make test
make lint
```

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
```

<<<<<<< HEAD
---
=======
---
>>>>>>> 3a45818 (feat: initial commit - AWS Security Scanner)
