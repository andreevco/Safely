declare module '*.svg?react' {
    import type { ComponentType, SVGProps } from 'react';

    const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;

    export default ReactComponent;
}

declare module '*.svg' {
    const url: string;

    export default url;
}
