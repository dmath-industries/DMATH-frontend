import DirectedGraph from 'graphology'


type NodeKey = string | number | symbol


export class RobertsFloresAlgorithm {
    private log: string[] = [];

    constructor(private graph: DirectedGraph) {
        this.graph = graph;
    }

    public execute(start: NodeKey = 0): string {
        this.log = [];
        const path: NodeKey[] = [start];
        this.log.push(`Добавлена вершина ${this.label(start)}  ${this.pathToString(path)}`);
        this.findHamiltonianCycles(path, start);
        return this.buildResult();
    }

    private findHamiltonianCycles(path: NodeKey[], current: NodeKey): void {
        const total = this.graph.order;

        if (path.length === total) {
            const isCycle = this.graph.hasEdge(current, path[0]);
            const mark = isCycle ? '\t   +' : '';
            this.log.push(
                `Добавлена вершина     ${this.label(current)}    ${this.pathToString(path)}${mark}`
            );
            return;
        }

        for (const next of this.graph.outNeighbors(current)) {
            if (!this.hasNode(path, next)) {
                path.push(next);
                this.log.push(`Добавлена вершина  ${this.label(next)}     ${this.pathToString(path)}`)
                this.findHamiltonianCycles(path, next);
                path.pop();
                this.log.push(`Удалена вершина    ${this.label(next)}     ${this.pathToString(path)}`);
            }
        }
        return;
    }

    pathToString(path: NodeKey[]): string {
        return path.map((v) => this.label(v)).join(' ')
    }


    private label(v: string | number | symbol): string {
        // нормализуем '0' -> 0
        const n = typeof v === 'string' && /^\d+$/.test(v) ? Number(v)
            : typeof v === 'number' ? v
                : NaN;

        if (Number.isInteger(n) && n >= 0) {
            return String.fromCharCode('a'.charCodeAt(0) + n);
        }
        return String(v);
    }

    private buildResult(): string {
        const lines: string[] = [];
        lines.push('```RobertsFloresAlgorithm');
        lines.push('С помощью плюса обозначены циклы');
        lines.push(`${'№'.padStart(3)}\t\tДействие`);
        lines.push();

        for (let i = 0; i < this.log.length; i++) {
            lines.push(`${String(i + 1).padStart(3)}\t${this.log[i]}`);
        }
        lines.push('```');
        return lines.join('\n');
    }

    private hasNode(path: NodeKey[], node: NodeKey): boolean {
        return path.some(n => String(n) === String(node));
    }
}