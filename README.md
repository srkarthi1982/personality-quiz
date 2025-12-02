# Ansiversa Mini-App Starter

This repository is the official starter template for all **Ansiversa Mini-Apps**.  
Every app in the Ansiversa ecosystem begins with this structure—clean, fast, and consistent.

If you are a developer or contributor, you can use this template to build any app in the ecosystem.

---

## 🚀 Features

- **Astro 5** — blazing-fast frontend framework  
- **Tailwind CSS** — utility-first styling  
- **@ansiversa/components** — shared UI library for unified design  
- **Global Styles** — imported automatically from the components package  
- **Clean File Structure** — easy to extend for any type of app  
- **Ready for Deployment** — optimized for Vercel out of the box  

---

## 📁 Project Structure

```
app/
 ├── public/
 ├── src/
 │   ├── layouts/
 │   │   └── AppShell.astro
 │   └── pages/
 │       ├── index.astro
 │       └── login.astro
 ├── astro.config.mjs
 ├── package.json
 ├── tsconfig.json
 ├── postcss.config.cjs
 └── tailwind.config.cjs
```

---

## 🧩 Using Ansiversa Components

All apps share the same UI look and feel using:

```ts
import "@ansiversa/components/styles/global.css";
import { WebLayout, AuthLayout } from "@ansiversa/components";
```

This ensures:

- Perfect consistency across **100+ apps**
- Unified branding  
- Fully reusable layouts and UI blocks  

---

## ▶️ Running Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## 🌐 Deployment

Ansiversa apps are optimized for **Vercel**:

- No configuration required
- Astro server output ready
- CI/CD supported automatically

Just link your repo to Vercel → deploy.

---

## 🔗 About Ansiversa

Ansiversa is a curated ecosystem of 100+ premium mini-apps designed for learning, productivity, writing, creativity, utilities, wellness, and more.

Each app shares:

- One global design language  
- One component system  
- One identity  
- Premium UX  

You are currently viewing the official **starter template** that powers all apps.

---

## 🤝 Contributing

If you wish to contribute to this template or suggest improvements, please open an issue or submit a pull request.

---

## 📄 License

MIT License — free to use and modify.
