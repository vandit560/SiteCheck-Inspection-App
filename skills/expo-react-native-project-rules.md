# AGENTS.md – Expo React Native Project Rules

## 1. Technology Stack

- Use Expo and React Native.
- Use TypeScript throughout the project.
- Use twrnc for styling.
- Use functional components and React Hooks.
- Follow Expo SDK-compatible packages.
- Prefer Expo APIs over custom native implementations.

## 2. Architecture

- Follow Feature-Based Architecture.
- Organize code by business features.
- Keep feature-specific components, hooks, services and types inside their feature.
- Keep shared code inside src/components, src/hooks, src/services and src/utils.
- Avoid unnecessary folder nesting.
- Keep dependencies between features minimal.
- Do not create duplicate implementations.

## 3. File Size Rules

- Maximum 300 lines per source file.
- Prefer files between 100–250 lines.
- Split large components into smaller reusable components.
- Extract business logic into custom hooks.
- Extract API logic into services.
- Keep each file focused on one responsibility.

## 4. Feature Structure

features/
feature-name/
components/
hooks/
screens/
services/
types/
utils/
constants/
index.ts

- Create only the folders needed by each feature.
- Keep feature-specific logic inside its feature.
- Export reusable feature APIs through index.ts.
- Avoid accessing another feature's internal files directly.
- Share common functionality through shared modules.

## 5. Reusable Components

- Check existing components before creating new ones.
- Prefer reusable and configurable components.
- Use TypeScript interfaces for props.
- Avoid hardcoded content and values.
- Extract repeated UI into shared components.
- Keep components focused and independent.
- Avoid unnecessary abstraction.

## 6. Styling – twrnc

- Use twrnc as the primary styling solution.
- Import twrnc using the existing project convention.
- Use `tw` for styling React Native components.
- Do not introduce NativeBase, React Native Paper or Tailwind CSS dependencies.
- Avoid StyleSheet unless a specific use case requires it.
- Avoid inline styles when twrnc classes can handle the styling.
- Use consistent spacing, typography and colors.
- Keep reusable design values in the theme/constants.
- Avoid duplicating long class strings across components.
- Extract repeated styles into reusable components or helpers.
- Support responsive layouts and different screen sizes.
- Use appropriate Safe Area handling.

## 7. TypeScript

- Avoid `any`.
- Define proper interfaces and types.
- Use typed navigation parameters.
- Type API requests and responses.
- Use explicit function return types where useful.
- Keep shared types in src/types.
- Keep feature-specific types inside features.

## 8. Reusable Hooks

- Extract reusable logic into custom hooks.
- Prefix hook names with `use`.
- Avoid duplicate business logic.
- Keep hooks independent of UI.
- Handle subscriptions and cleanup correctly.
- Follow React Hooks rules.

## 9. API and Services

- Keep API calls inside service files.
- Never put API implementation directly inside UI components.
- Centralize API configuration.
- Handle loading, success and error states.
- Use typed API responses.
- Reuse common API methods.
- Keep secrets in environment variables.

## 10. State Management

- Reuse the existing state management solution.
- Keep local UI state inside components.
- Use global state only when necessary.
- Avoid duplicate state.
- Keep business logic outside presentation components.

## 11. Navigation

- Follow the existing Expo Router or React Navigation setup.
- Keep navigation configuration organized.
- Use typed route parameters.
- Avoid duplicate route definitions.
- Keep feature navigation organized.

## 12. Performance

- Use FlatList or FlashList for large lists.
- Implement pagination for large datasets.
- Avoid unnecessary re-renders.
- Use useMemo and useCallback when beneficial.
- Optimize image rendering.
- Clean up listeners and subscriptions.

## 13. Error Handling

- Handle API and runtime errors.
- Never silently ignore errors.
- Display meaningful error messages.
- Handle loading and empty states.
- Validate user input.
- Avoid exposing sensitive information.

## 14. Accessibility

- Add accessibilityLabel to interactive elements.
- Use appropriate accessibilityRole.
- Maintain readable font sizes.
- Provide sufficient color contrast.
- Ensure accessible touch targets.

## 15. Code Quality

- Follow DRY and SOLID principles where appropriate.
- Use descriptive names.
- Remove unused imports and code.
- Avoid unnecessary dependencies.
- Avoid deeply nested conditions.
- Do not modify unrelated functionality.

## 16. Testing

- Test reusable components and hooks.
- Test important business logic.
- Test API success and failure cases.
- Run TypeScript checks.
- Run linting and relevant tests.

## 17. AI Development Rules

Before implementing:

1. Inspect the existing project structure.
2. Understand the existing architecture.
3. Search for reusable components and hooks.
4. Check installed dependencies.
5. Follow existing naming conventions.

During implementation:

1. Follow feature-based architecture.
2. Reuse existing code whenever possible.
3. Use twrnc for styling.
4. Avoid duplicate components and logic.
5. Keep files below 300 lines.
6. Avoid unnecessary packages.
7. Preserve existing functionality.

After implementation:

1. Check TypeScript errors.
2. Check imports and dependencies.
3. Check linting.
4. Verify navigation and functionality.
5. Confirm files are below 300 lines.
6. Summarize modified and new files.

## Golden Rules

- Feature-Based Architecture is mandatory.
- Reusability is a priority.
- twrnc is the primary styling solution.
- Maximum 300 lines per source file.
- Never duplicate existing functionality.
- Keep code modular, scalable and maintainable.
