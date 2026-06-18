---
name: base-ui
description: Use when building, reviewing, or modifying React UI with @base-ui/react components or utilities, including Base UI dialogs, popovers, menus, selects, tabs, tooltips, forms, fields, composition, accessibility, animation, styling, utilities and Tailwind CSS examples.
---

# Base UI

Use the official Base UI Markdown docs before changing Base UI code.

## Workflow

1. Check whether the project uses `@base-ui/react` and which styling stack is present by reading `package.json` and nearby component code.
2. Open the official docs index at https://base-ui.com/llms.txt.
3. Read only the relevant Markdown docs for the component or topic being changed.
4. Prefer Base UI's documented composition, accessibility, and state patterns over custom behavior.
5. Keep Base UI components unstyled at the primitive layer; put visual styling in the app's existing component/CSS conventions.
6. Verify imports, required component parts, controlled/uncontrolled props, portals, positioning, focus behavior, and keyboard interactions against the docs for the specific component.

## Common Docs

- Quick start (A quick guide to getting started with Base UI): https://base-ui.com/react/overview/quick-start.md
- Accessibility (Learn how to make the most of Base UI's accessibility features and guidelines): https://base-ui.com/react/overview/accessibility.md
- Styling (Learn how to style Base UI components with your preferred styling engine): https://base-ui.com/react/handbook/styling.md
- Animation (A guide to animating Base UI components): https://base-ui.com/react/handbook/animation.md
- Composition (A guide to composing Base UI components with your own React components): https://base-ui.com/react/handbook/composition.md
- Customization (A guide to customizing the behavior of Base UI components): https://base-ui.com/react/handbook/customization.md
- Forms (A guide to building forms with Base UI components): https://base-ui.com/react/handbook/forms.md
- TypeScript (A guide to using TypeScript with Base UI components): https://base-ui.com/react/handbook/typescript.md

## Component Docs

Use the component links from `llms.txt`. Common paths follow this pattern:

```text
https://base-ui.com/react/components/dialog.md
https://base-ui.com/react/components/popover.md
https://base-ui.com/react/components/select.md
https://base-ui.com/react/components/tabs.md
https://base-ui.com/react/components/tooltip.md
```

## Utilities
- CSP Provider (A CSP provider component that applies a nonce to inline `<style>` and `<script>` tags rendered by Base UI components, and can disable inline `<style>` elements): https://base-ui.com/react/utils/csp-provider.md
- Direction Provider (A direction provider component that enables RTL behavior for Base UI components): https://base-ui.com/react/utils/direction-provider.md
- mergeProps (A utility to merge multiple sets of React props, handling event handlers, className, and style props intelligently): https://base-ui.com/react/utils/merge-props.md
- useRender (Hook for enabling a render prop in custom components): https://base-ui.com/react/utils/use-render.md

## Tailwind Notes

Base UI docs use Tailwind CSS v4 examples. If this project uses Tailwind CSS v3, convert unsupported v4 utilities and syntax to v3-compatible CSS or existing project classes.

## Fallback

If the official docs are unavailable, inspect the installed `@base-ui/react` package types/source and existing local usage before editing. Mention that the live docs could not be checked if the implementation depends on uncertain API details.
