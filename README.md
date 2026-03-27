# Confeitaria Flow

Aplicação de gestão para confeitaria com frontend em React + Vite e servidor Express em TypeScript.

## Requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

O servidor sobe por padrão na porta `5000`. Se a porta já estiver ocupada:

```bash
npx cross-env PORT=5001 NODE_ENV=development tsx server/index.ts
```

## Produção local

```bash
npm start
```

Se o bundle de produção ainda não existir, o `start` gera o `dist` antes de subir o servidor. Se o `dist` já existir, ele apenas inicia a aplicação em modo de produção.

## Build

```bash
npm run build
```

## Verificação de tipos

```bash
npm run check
```

## Estado atual

- O frontend funciona hoje com dados mockados persistidos em `localStorage`.
- O backend Express existe, mas as rotas de negócio ainda não foram implementadas.
- O botão `Reiniciar demo` limpa os dados mockados salvos no navegador.
