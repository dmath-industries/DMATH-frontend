import {DirectedGraph} from 'graphology'
import {RobertsFloresAlgorithm} from "@/algorithms/roberts-flores";

function buildSampleGraph(): DirectedGraph {
    const g = new DirectedGraph();
    for (let i = 0; i < 6; i++) g.addNode(i);
    g.addDirectedEdge(0, 1);
    g.addDirectedEdge(0, 3);
    g.addDirectedEdge(1, 5);
    g.addDirectedEdge(2, 5);
    g.addDirectedEdge(3, 4);
    g.addDirectedEdge(3, 2);
    g.addDirectedEdge(4, 1);
    g.addDirectedEdge(5, 0);
    g.addDirectedEdge(5, 4);
    return g;
}

function acyclicGraph(): DirectedGraph {
    const g = new DirectedGraph();
    // DAG: 0->1->2, 0->2 (без обратных рёбер)
    [0, 1, 2].forEach(n => g.addNode(n));
    g.addDirectedEdge(0, 1);
    g.addDirectedEdge(1, 2);
    g.addDirectedEdge(0, 2);
    return g;
}

test('contains string "24	Удалена вершина    d     a"', () => {
    const algo = new RobertsFloresAlgorithm(buildSampleGraph());
    const out = algo.execute();
    console.log(out)
    expect(out.includes('24	Удалена вершина    d     a')).toBe(true);

});


test('does NOT mark "+" when no closing edge exists (no cycle)', () => {
    const algo = new RobertsFloresAlgorithm(acyclicGraph());
    const out = algo.execute();
    console.log(out);
    expect(out.includes('+')).toBe(false);
    // если алгоритм логирует финальное состояние — проверь что есть хотя бы один шаг добавления
    expect(out).toMatch(/Добавлена вершина/);
});