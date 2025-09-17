# Commit Message Guidelines

This document provides guidelines for writing clear and consistent commit messages for the AI Tools Hub project.

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Scope (Optional)

The scope should be the name of the affected component:

- **tools**: Changes to AI tools data or structure
- **contributors**: Changes to contributors data
- **ui**: User interface changes
- **docs**: Documentation changes
- **config**: Configuration files
- **assets**: Images, icons, or other assets
- **analytics**: Analytics or tracking related changes
- **seo**: SEO optimization changes
- **build**: Build system or dependencies
- **ci**: Continuous integration changes
- **templates**: Issue or PR templates

### Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end
- Maximum 50 characters

### Body (Optional)

Just as in the **subject**, use the imperative, present tense. The body should include the motivation for the change and contrast this with previous behavior.

### Footer (Optional)

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit **Closes**.

## Examples

### Simple commit

```
feat(tools): add new AI writing tool ChatGPT
```

### Commit with body

```
fix(ui): resolve mobile navigation menu not closing

The mobile menu was staying open after clicking a navigation link.
Added event listener to close menu on link click for better UX.
```

### Breaking change

```
feat(tools): restructure tools data format

BREAKING CHANGE: Tools JSON structure has changed from array to object
with category grouping. Update any scripts that parse tools data.

Closes #15
```

### Documentation update

```
docs: update README with new installation instructions
```

### Bug fix with issue reference

```
fix(analytics): correct event tracking for tool clicks

Fixes #23
```

## Best Practices

### Do

- Write clear, descriptive commit messages
- Use present tense ("add feature" not "added feature")
- Keep the subject line under 50 characters
- Reference issues and pull requests when applicable
- Group related changes into single commits
- Make atomic commits (one logical change per commit)

### Don't

- Use vague messages like "fix stuff" or "update code"
- Include multiple unrelated changes in one commit
- Use past tense in commit messages
- Exceed 72 characters in the body lines
- Commit commented-out code or temporary files

## Commit Message Templates

### Adding a new AI tool

```
feat(tools): add [Tool Name] to [category]

- Add [Tool Name] to src/data/links.json
- Include clear description and verified URL
- Ensure tool has free tier or is completely free
```

### Fixing a bug

```
fix(ui): resolve [specific issue]

- Describe what was broken
- Explain how it was fixed
- Mention any side effects or considerations
```

### Updating documentation

```
docs: update [document name]

- Update file paths to reflect new src/ structure
- Add information about new build process
- Include new issue template documentation
```

### Performance improvements

```
perf(ui): optimize tool card rendering

- Implement lazy loading for tool images
- Reduce DOM queries in filter function
- Improve page load time by ~200ms
```

## Automated Checks

This project may include commit message linting to ensure consistency. Make sure your commit messages follow these guidelines to pass automated checks.

## Questions?

If you have questions about commit message guidelines, please:

1. Check existing commit history for examples
2. Open an issue for clarification
3. Ask in the community discussions

Remember: Good commit messages help maintainers and contributors understand the project history and make debugging easier!
