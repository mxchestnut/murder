# Contributing to Murder

Thank you for your interest in contributing! This guide will help you get started.

## 🎯 What We're Looking For

We welcome contributions that improve:
- **Code quality** - Refactoring, bug fixes, performance improvements
- **Features** - New Discord bot commands, web portal features
- **Documentation** - Improve README, add code comments, write guides
- **Security** - Security audits, vulnerability fixes
- **Testing** - Add tests for existing features

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/murder.git
   cd murder
   ```
3. **Set up development environment** (see [README.md](README.md))
4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style
- **TypeScript** is used throughout the project
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic

### Commit Messages
Use clear, descriptive commit messages:
```
✅ Good: "Add dice roll validation to prevent negative modifiers"
❌ Bad: "fix stuff"
```

### Before Submitting
- [ ] Code builds without errors (`npm run build`)
- [ ] Test your changes locally
- [ ] Update documentation if needed
- [ ] Run linter/formatter if available

## 🔐 Security

**Found a security vulnerability?**
- **DO NOT** open a public issue
- Email security concerns privately
- See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for security guidelines

## 📬 Pull Request Process

1. **Push your branch** to your fork
2. **Open a Pull Request** to the main repository
3. **Describe your changes** - What does it do? Why is it needed?
4. **Link any related issues** - Use "Fixes #123" if applicable
5. **Be responsive** to feedback and questions

## 🐛 Reporting Bugs

When reporting bugs, include:
- **Description** - What happened vs. what you expected
- **Steps to reproduce** - How can we recreate the issue?
- **Environment** - OS, Node version, browser (if frontend)
- **Screenshots** - If applicable

## 💡 Suggesting Features

Feature requests are welcome! Please include:
- **Use case** - What problem does this solve?
- **Proposed solution** - How should it work?
- **Alternatives** - Any other approaches you considered?

## 📚 Project Structure

```
murder/
├── backend/          # Express API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Discord bot, external APIs
│   │   ├── db/       # Database schema and connection
│   │   └── middleware/ # Auth, admin checks
│   └── dist/         # Compiled JavaScript
├── frontend/         # React web portal
│   └── src/
│       ├── components/
│       └── utils/
└── README.md
```

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (Drizzle ORM)
- Discord.js v14
- Passport.js (authentication)

**Frontend:**
- React + TypeScript
- Vite (build tool)
- Tiptap 3.0 (rich text editor)

## ❓ Questions?

- Check existing issues and discussions
- Open a new issue for questions
- Be respectful and constructive

---

**Thank you for contributing to Murder!** 🎭
