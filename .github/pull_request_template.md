## Description

<!-- Provide a clear and concise description of your changes -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] New tool (adds a new tool to LocalGearbox)
- [ ] Enhancement (improvement to existing feature/tool)
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)

## Related Issue

<!-- Link to the issue this PR addresses -->

Fixes #<!-- issue number -->

## Changes Made

<!-- List the specific changes made in this PR -->

-
-
-

## Testing Checklist

<!-- Mark completed items with an "x" -->

- [ ] I have tested these changes locally
- [ ] All existing tests pass (`npm run test`)
- [ ] I have added new tests for new functionality
- [ ] E2E tests pass (`npm run test:e2e:smoke`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code is properly formatted (`npm run format:check`)

## Security Checklist

<!-- Mark completed items with an "x" -->

- [ ] I have followed the input validation guidelines (using `validateInput()`)
- [ ] No use of `eval()`, `Function()`, or `new Function()`
- [ ] All user inputs are properly sanitized
- [ ] No sensitive data is logged or exposed
- [ ] Changes maintain client-side only processing (no data transmission)

## Accessibility Checklist

<!-- Mark completed items with an "x" -->

- [ ] All interactive elements have proper ARIA labels
- [ ] Keyboard navigation works correctly
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Screen reader compatibility tested (if applicable)

## Documentation

<!-- Mark completed items with an "x" -->

- [ ] I have updated relevant documentation (README, CONTRIBUTING, etc.)
- [ ] Code comments added for complex logic
- [ ] Tool metadata updated in `tool-registry.ts` (if adding/modifying a tool)

## Screenshots

<!-- If applicable, add screenshots or GIFs demonstrating the changes -->

## Additional Notes

<!-- Any additional information reviewers should know -->

## Reviewer Checklist

<!-- For maintainers reviewing this PR -->

- [ ] Code follows project conventions and architecture
- [ ] Changes align with privacy-first, client-side only principles
- [ ] No unnecessary dependencies added
- [ ] Performance impact is acceptable
- [ ] Security best practices followed
- [ ] Tests provide adequate coverage
