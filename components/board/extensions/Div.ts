import { Node, mergeAttributes } from '@tiptap/core';

export interface DivOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        div: {
            setDiv: () => ReturnType;
            toggleDiv: () => ReturnType;
            unsetDiv: () => ReturnType;
        };
    }
}

export const Div = Node.create<DivOptions>({
    name: 'div',

    group: 'block',

    content: 'block+',

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            class: {
                default: null,
                parseHTML: element => element.getAttribute('class'),
                renderHTML: attributes => {
                    if (!attributes.class) {
                        return {}
                    }
                    return {
                        class: attributes.class,
                    }
                },
            },
            style: {
                default: null,
                parseHTML: element => element.getAttribute('style'),
            },
        };
    },

    parseHTML() {
        return [
            { tag: 'div' },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addCommands() {
        return {
            setDiv: () => ({ commands }) => {
                return commands.setNode(this.name)
            },
            toggleDiv: () => ({ commands }) => {
                return commands.toggleNode(this.name, 'paragraph')
            },
            unsetDiv: () => ({ commands }) => {
                return commands.lift(this.name)
            },
        }
    },
});
