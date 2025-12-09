function BronKerboschContent(){
      return (
    <>
      {/* Информация об алгоритме - сначала */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
          <h3 className="text-base font-semibold text-neutral-200 mb-3">О алгоритме</h3>
          <div className="text-sm text-neutral-300 space-y-2 leading-relaxed">
            <p>
              <strong className="text-white">Алгоритм Брона-Кербоша</strong> — это метод поиска всех 
              максимальных независимых множеств (МВУМ) в неориентированном графе.
            </p>
            <p>
              Алгоритм использует три множества: S (текущее множество), P (кандидаты) и M (исключенные).
              Он систематически строит все возможные независимые множества вершин.
            </p>
            <p>
              <strong>Независимое множество</strong> — это множество вершин, никакие две из которых не соединены ребром.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
          <h3 className="text-base font-semibold text-blue-200 mb-3">Как использовать</h3>
          <ol className="text-sm text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Создайте неориентированный граф используя редактор или матрицу</li>
            <li>Нажмите "Запустить алгоритм" для выполнения</li>
            <li>Используйте панель управления для просмотра шагов</li>
            <li>Перетаскивайте вершины для лучшей визуализации</li>
          </ol>
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs font-medium">
              💡 Совет: Алгоритм работает с неориентированными графами. Для лучших результатов используйте граф с 4-7 вершинами.
            </p>
          </div>
        </div>
      </div>

      {/* Редактор графа - перед визуализацией */}
      <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-neutral-200">Создание графа</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode('editor')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                inputMode === 'editor'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              ✏️ Редактор
            </button>
            <button
              onClick={() => setInputMode('matrix')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                inputMode === 'matrix'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              📊 Матрица
            </button>
          </div>
        </div>
        
        {inputMode === 'editor' ? (
          <GraphEditor
            onAddNode={addNode}
            onAddEdge={addEdge}
            onClear={clearGraph}
            onLoadSample={handleLoadSample}
            nodeCount={graphModel.nodeCount}
          />
        ) : (
          <GraphMatrixInput
            onSubmit={handleMatrixSubmit}
            placeholder="Введите матрицу смежности построчно, используя запятую как разделитель между элементами (для неориентированного графа)"
          />
        )}
      </div>
    </>
  );
}
}