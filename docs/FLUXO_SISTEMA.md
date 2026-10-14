# ValuM&A — Fluxograma Funcional

Documento complementar a `docs/PACOTE_MONOGRAFIA_TCC.md` (seção 6). Cobre apenas comportamentos realmente implementados, confirmados por leitura do código.

## Fluxograma principal (Mermaid)

```mermaid
flowchart TD
    Start(["Usuário acessa o sistema"]) --> Auth{"Possui sessão válida?"}
    Auth -- "não" --> Login["Login / Cadastro\n(e-mail e senha)"]
    Login --> Dashboard
    Auth -- "sim" --> Dashboard["Dashboard\nlista de processos"]

    Dashboard --> NovoOuAbre{"Novo processo\nou abrir existente?"}
    NovoOuAbre -- "novo" --> CriaProcesso["Cria processo\n(insert em processos)"]
    CriaProcesso --> Motor
    NovoOuAbre -- "abrir existente" --> VoltaEtapa["Retoma na última etapa\ncom dados salvos"]
    VoltaEtapa --> Motor

    Motor["Etapa: Motor de Análise\n(Essencial ou Configurável)"] --> Perfil
    Perfil["Etapa: Perfil"] --> Financeiro
    Financeiro["Etapa: Financeiro\n(DRE dinâmico, balanço, dívidas, caixa)"] --> ExcelOpt{"Importar via Excel?"}
    ExcelOpt -- "sim" --> Excel["Baixa modelo .xlsx →\npreenche → importa →\nmescla por ano"]
    Excel --> Operacao
    ExcelOpt -- "não (digitação manual)" --> Operacao
    Operacao["Etapa: Operação"] --> Mercado
    Mercado["Etapa: Mercado"] --> Documentos
    Documentos["Etapa: Documentos\n(upload por categoria)"] --> GerarResultado

    GerarResultado["Gerar Resultado"] --> ValidaMinimos{"Campos mínimos\ne Motor válidos?"}
    ValidaMinimos -- "não" --> BloqueiaGeracao["HTTP 422 —\nlista o que falta"]
    BloqueiaGeracao --> Financeiro
    ValidaMinimos -- "sim" --> CalculaValuation["Calcula Equity Value\n(Múltiplo / DCF / Patrimonial)"]
    CalculaValuation --> CalculaProntidao["Calcula Índice de Prontidão\n(4 dimensões)"]
    CalculaProntidao --> ChamaIA["Análise Estratégica (IA)\ncontexto = dados + números já calculados"]
    ChamaIA --> Persiste["Upsert em resultados\n(motor_snapshot + modelo_versao)"]
    Persiste --> TelaResultado["Tela de Resultado"]

    TelaResultado --> VerExplicabilidade["Como chegamos a este resultado?"]
    TelaResultado --> VerPendencias["Pendências da Prontidão"]
    TelaResultado --> Assistente["Assistente conversacional\n(chat sobre o resultado)"]
    TelaResultado --> PDF["Imprimir / baixar PDF"]

    TelaResultado -. "usuário volta e altera\numa etapa do intake" .-> Financeiro
    Financeiro -. "autosave grava\nintake_data.atualizado_em" .-> Stale["Resultado marcado como\ndesatualizado (sem apagar)"]
    Stale -. "Recalcular" .-> GerarResultado
```

## Observações sobre o fluxo

- **Autosave em toda etapa do intake:** não há um botão "salvar" — cada formulário grava automaticamente 1,5s após a última alteração (`useAutosave`). O fluxograma omite essa gravação em cada caixa de etapa por clareza visual, mas ela ocorre em todas (Motor, Perfil, Financeiro, Operação, Mercado, Documentos).
- **A importação por Excel é opcional e não substitui a etapa Financeiro** — ela só preenche o mesmo formulário que o preenchimento manual preencheria, mesclando por ano; o usuário pode misturar os dois métodos livremente no mesmo processo.
- **"Gerar Resultado" não é bloqueado pela Prontidão incompleta** — só pelos campos mínimos (RG-40 de `docs/REGRAS_NEGOCIO_VALUMA_V1.md`) e pela validade da configuração do Motor. É possível (e esperado) gerar um resultado com a Prontidão longe de 100%.
- **Mesmo sem nenhum método de valuation aplicável** (EBITDA ≤ 0 e Patrimônio Líquido ≤ 0 simultaneamente), o fluxo de geração de resultado não para — ele produz um resultado parcial (Prontidão + Análise Estratégica, sem o número de Equity Value). Omitido do diagrama por clareza, mas é um estado de negócio explicitamente válido (RG-25/RG-26 da v1.0).
- **Voltar e alterar uma etapa do intake depois de já ter um resultado** não apaga nada — apenas marca o resultado existente como desatualizado (comparação de timestamps), oferecendo "Recalcular" sem forçá-lo.
