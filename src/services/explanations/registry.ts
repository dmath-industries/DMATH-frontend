import { explanationGeneratorRegistry } from './ExplanationGenerator';
import {
  BellmanFordExplanationGenerator,
  PrimExplanationGenerator,
  HungarianExplanationGenerator,
  RobertsFloresExplanationGenerator,
  BronKerboschExplanationGenerator,
  GraphColoringExplanationGenerator,
} from './algorithm-specific';

explanationGeneratorRegistry.register('bellman-ford', new BellmanFordExplanationGenerator());
explanationGeneratorRegistry.register('prim', new PrimExplanationGenerator());
explanationGeneratorRegistry.register('hungarian', new HungarianExplanationGenerator());
explanationGeneratorRegistry.register('roberts-flores', new RobertsFloresExplanationGenerator());
explanationGeneratorRegistry.register('bron-kerbosch', new BronKerboschExplanationGenerator());
explanationGeneratorRegistry.register('graph-coloring', new GraphColoringExplanationGenerator());
