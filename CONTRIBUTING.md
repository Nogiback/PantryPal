# Contributing to PantryPal

Thank you for your interest in contributing to PantryPal! We welcome contributions from everyone. By participating in this project, you help make PantryPal a better application for all its users.

## How to Contribute

### 1. Reporting Bugs
If you find a bug in the application, please open an issue in the repository. Include as much detail as possible:
* A clear and descriptive title.
* Steps to reproduce the issue.
* Expected vs. actual behavior.
* Screenshots (if applicable).
* Information about your environment (Browser, OS, etc.).

### 2. Suggesting Enhancements
Have an idea for a new feature or an improvement? Open an issue describing your idea. Explain why it would be beneficial and provide any relevant mockups or examples.

### 3. Code Contributions

#### Local Development Setup
1. Fork the repository.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/PantryPal.git
   cd PantryPal/pp-frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file following the instructions in the `README.md`.
5. Start the development server:
   ```bash
   npm run dev
   ```

#### Branching Strategy
* **`master`**: The main branch containing production-ready code. Commits pushed here automatically trigger AWS Amplify deployments.
* Create a new branch for every feature or bugfix. Name it descriptively, e.g., `feature/ai-recipe-generator` or `bugfix/login-error`.

#### Making Changes
1. Create a branch: `git checkout -b feature/your-feature-name`
2. Make your changes in the `src/` directory.
3. Ensure your code follows the existing style (React, Vite, TailwindCSS).
4. Test your changes locally to ensure everything works as expected.
5. Commit your changes with a clear and concise commit message:
   ```bash
   git commit -m "Add: Descriptive message of what was changed"
   ```

#### Submitting a Pull Request
1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request (PR) against the `master` branch of the original repository.
3. In the PR description, explain what changes you made, why you made them, and link to any relevant issues.
4. Once submitted, your PR will be reviewed. You may be asked to make some changes before it is merged.

## Coding Guidelines
* **Components:** Use functional components and React Hooks.
* **Styling:** Use TailwindCSS utility classes for styling.
* **State Management:** Follow the project's existing state management patterns (e.g., Redux).
* **Formatting:** Ensure your code is formatted consistently (consider using Prettier).

Thank you for contributing!
