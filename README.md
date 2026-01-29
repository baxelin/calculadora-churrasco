# Calculadora de Churrasco 2000 🔥🥩🍺

Uma calculadora divertida (e bem direta) pra estimar **carnes, extras e bebidas** para um churrasco, com interface descontráida e foco total em usabilidade: preencher, clicar, ver resultado e compartilhar.

Demo: https://calculadora-churrasco-2000.vercel.app/  
GitHub (autor): https://github.com/baxelin

---

## O que esse projeto faz

- Calcula quantidade estimada de **carne total** com base em:
  - número de adultos
  - número de crianças
  - duração do churrasco
  - margem de sobra (opcional)
- Divide a carne entre os tipos selecionados por **Preferência (%)**
  - as preferências **sempre somam 100%**
  - você pode **travar** uma carne (ex.: Picanha 50%) e o resto se ajusta automaticamente
- Calcula itens extras:
  - pão de alho, carvão, sal grosso
- Bebidas:
  - cerveja com estimativa e conversão em **latas (350ml)**
  - refri/água com estimativa e conversão em **garrafas de 2L**
- Experiência:
  - fluxo em 3 estados: **início → loading → resultado**
  - animações e UI leve (sem “cara de corporativo”)
  - botão para **copiar texto** e **enviar no WhatsApp** com o resultado e links

---

## Stack / tecnologias

- **Astro** (site estático)
- **Vite** (bundler/Dev Server via Astro)
- **JavaScript** (vanilla, módulos ES)
- **CSS Modules** + CSS global (estilo e responsividade)
- **Vercel** (deploy)
- **GitHub** (versionamento)

---

## Por que isso é interessante

- Projeto completo de ponta a ponta: **dev → build → preview → deploy**
- Atenção a problemas reais de produção:
  - paths/case-sensitivity (Linux/Vercel) vs Windows
  - build estático e deploy contínuo
- Lógica + UX:
  - estado “loading” controlado
  - resultados dinâmicos (recalcula automaticamente)
  - compartilhamento via WhatsApp e cópia para clipboard
- Responsividade planejada por breakpoints:
  - Desktop (≥1110px)
  - Tablet (721–1109px)
  - Mobile (≤720px)

---

## Rodando localmente

Pré-requisitos:
- Node.js 18+ (recomendado)
- npm

Clone e rode:
```bash
git clone https://github.com/baxelin/calculadora-churrasco.git
cd calculadora-churrasco/frontend
npm install
npm run dev
```

Acesse o endereço exibido no terminal (geralmente `http://localhost:4321`).

---

## Build e preview (como produção)

```bash
cd frontend
npm run build
npm run preview
```

Use `preview` para validar antes de publicar.

---

## Deploy (Vercel)

Deploy automático via GitHub:
1. Importar o repositório na Vercel
2. Definir **Root Directory** = `frontend`
3. Preset: **Astro**
4. Build command: `npm run build`
5. Output directory: `dist`

A cada `git push` no branch principal, a Vercel faz deploy automaticamente.

---

## Estrutura do projeto

Dentro de `frontend/`:

- `src/components/BarbecueCalculator.astro`  
  Componente principal da interface (inputs, estados, cards, botões)
- `src/scripts/barbecueCalculator.js`  
  Lógica do app (cálculo, preferências %, travas, loading, share)
- `src/config/bbqConfig.js`  
  Regras/constantes (carnes, perfis de duração, padrões)
- `src/styles/global.css`  
  Background e estilos globais
- `src/styles/calculator.module.css`  
  Estilos do componente, layout, responsividade

---

## Ajustando as regras do cálculo

As regras ficam em:
- `frontend/src/config/bbqConfig.js`

É lá que você ajusta:
- consumo por adulto/criança
- duração
- perfis de cerveja
- padrões de extras (carvão/sal/pão)

---

## Autor

Lucas Baccelli  
GitHub: [Baxelin](https://github.com/baxelin)
LinkedIn: [Lucas Baccelli](https://www.linkedin.com/in/lucasbaccelli/)