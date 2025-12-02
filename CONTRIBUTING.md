# Contributing to Ansiversa Mini-App Starter

Thank you for your interest in improving the Ansiversa Mini-App Starter!

## 🧩 How this starter is used

This repository is used as the **golden template** for all mini-apps in the Ansiversa ecosystem.
Changes here will eventually flow into many apps, so edits should be:

- Small
- Clear
- Backwards compatible where possible

## ✅ Contribution steps

1. **Fork** this repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/my-change
   ```
3. Make your changes.
4. Run the app locally:
   ```bash
   npm install
   npm run dev
   ```
5. Ensure the starter builds:
   ```bash
   npm run build
   ```
6. Commit and push:
   ```bash
   git commit -m "Describe your change"
   git push origin feature/my-change
   ```
7. Open a **Pull Request** and clearly describe:
   - What you changed
   - Why you changed it
   - Any impact on downstream apps

## 🧪 Guidelines

- Keep the starter **generic** – avoid app-specific logic.
- Do not hard-code mini-app names.
- Prefer changes that improve **all apps** (UX, DX, structure, performance).

Thank you for helping keep the Ansiversa ecosystem clean and consistent 💚
