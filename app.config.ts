// Nuxt UI theme for the BloodHeaven design system.
//
// Nuxt merges every layer's `app.config.ts` with the consuming application's, the
// application winning — so this is the one place the `.hm-*` look is expressed for
// the Nuxt UI components the layer's own primitives are built on. Applications
// used to carry a ~220-line copy of this each; they should now carry only what is
// genuinely theirs (the `authUi` hooks, the icon mode).
//
// Nuxt UI 4 themes are Tailwind Variants definitions: `slots` name the elements a
// component renders, `variants` are the axes a prop selects along, and both merge
// on top of the library's own theme rather than replacing it. That is why only the
// deltas appear here — everything unstated keeps the library default.
//
// Only the seven components the platform actually renders are themed: Input,
// Textarea, SelectMenu, FormField, Checkbox, Icon and Form. Everything else in the
// design system is a `.hm-*` primitive in `assets/styles/hm-base.css`.

/** The shared control skin: hm surface, 1px hm border, accent on hover and focus. */
const HM_CONTROL =
  'text-hm-text bg-hm-bg ring ring-inset ring-hm-border hover:ring-hm-accent focus:ring-hm-accent focus-visible:ring-hm-accent disabled:ring-hm-border';

/** Padding per control size. `2xs` is the toolbar/filter height the manifest pins. */
const CONTROL_SIZES = {
  '2xs': { base: 'px-2 py-[11px] text-xs' },
  xs: { base: 'px-2.5 py-[11px] text-xs' },
  sm: { base: 'p-3.5 text-sm' },
};

export default defineAppConfig({
  ui: {
    input: {
      slots: {
        // `root` is the wrapper Nuxt UI renders around the control; it is
        // `inline-flex` by default, which would shrink the field to its content.
        root: 'w-full',
        base: 'placeholder:text-hm-muted disabled:bg-hm-bg/50 disabled:text-hm-muted',
      },
      variants: {
        size: CONTROL_SIZES,
        variant: {
          // The design system's own control skin, and the default for every input.
          hm: HM_CONTROL,
          // Inline editing inside a table cell — same skin, body type instead of the
          // condensed filter type.
          table: `${HM_CONTROL} text-sm`,
        },
      },
      defaultVariants: {
        variant: 'hm',
        size: '2xs',
      },
    },

    textarea: {
      slots: {
        // `root` is the wrapper Nuxt UI renders around the control; it is
        // `inline-flex` by default, which would shrink the field to its content.
        root: 'w-full',
        base: 'placeholder:text-hm-muted disabled:bg-hm-bg/50 disabled:text-hm-muted',
      },
      variants: {
        size: CONTROL_SIZES,
        variant: {
          hm: HM_CONTROL,
          table: `${HM_CONTROL} text-sm`,
        },
      },
      defaultVariants: {
        variant: 'hm',
        size: '2xs',
      },
    },

    selectMenu: {
      slots: {
        // The trigger is a control like any other; the panel is a floating surface,
        // which per manifest § 16.1 sits on hm-surface with an hm-border ring.
        base: 'placeholder:text-hm-muted disabled:bg-hm-bg/50 disabled:text-hm-muted',
        placeholder: 'text-hm-muted',
        content: 'bg-hm-surface ring ring-hm-border rounded-lg',
        item: 'text-hm-text data-highlighted:not-data-disabled:text-hm-accent data-highlighted:not-data-disabled:before:bg-hm-accent/8',
        itemTrailingIcon: 'text-hm-accent',
        input: 'border-b border-hm-border',
      },
      variants: {
        size: CONTROL_SIZES,
        variant: {
          hm: HM_CONTROL,
          table: `${HM_CONTROL} text-sm`,
        },
      },
      defaultVariants: {
        variant: 'hm',
        size: '2xs',
      },
    },

    formField: {
      slots: {
        label: 'block text-hm-muted uppercase mb-1.5',
        error: 'mt-2 text-hm-error',
        help: 'mt-2 text-hm-muted',
        hint: 'text-hm-muted',
        description: 'text-hm-muted',
      },
    },

    // No application renders a `<UCheckbox>` any more (`<UiCheckbox>` is the one
    // form checkbox, DESIGN_MANIFEST.md § 13.6); this keeps a stray one on the
    // `.hm-check` geometry — 14px box, 3px radius — instead of the library's 20px.
    checkbox: {
      slots: {
        base: 'size-3.5 cursor-pointer rounded-[3px] ring ring-inset ring-hm-border',
        label: 'cursor-pointer text-hm-text',
        description: 'text-hm-muted',
      },
    },
  },

  icon: {
    mode: 'svg',
    class: 'nuxt-icon',
  },
});
