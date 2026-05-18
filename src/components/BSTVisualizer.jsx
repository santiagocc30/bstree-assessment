/**
 * BSTVisualizer.jsx
 *
 * Componente principal del visualizador de Árbol Binario de Búsqueda.
 */

import { useState, useCallback, useMemo } from "react";
import Tree from "react-d3-tree";

import { insert, search, inOrder, preOrder, postOrder, toD3Format, randomInt } from "../utils/bst";
import TraversalPanel from "./TraversalPanel";
import SearchBar from "./SearchBar";

import styles from "./BSTVisualizer.module.css";

// ─── Component ───────────────────────────────────────────────────────────────

export default function BSTVisualizer() {
  const [root, setRoot] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [activeTraversal, setTraversal] = useState(null); // "inOrder" | "preOrder" | "postOrder"
  const [searchTerm, setSearchTerm] = useState("");
  const [foundNode, setFoundNode] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // ── Insert ──────────────────────────────────────────────────────────────────
  const handleInsert = () => {
    const parsed = parseInt(inputValue, 10);

    // FIX BUG #6 (UX): Si el input no es un número válido, mostrar mensaje de error
    // en lugar de ignorar silenciosamente la acción.
    if (isNaN(parsed)) {
      setErrorMessage("⚠️ Por favor ingresa un número entero válido.");
      return;
    }

    setRoot((prevRoot) => insert(prevRoot, parsed));
    setInputValue("");
    setErrorMessage(""); // Limpiar error previo si la inserción es exitosa
  };

  // ── Random Insert ───────────────────────────────────────────────────────────
  const handleRandomInsert = () => {
    const value = randomInt(1, 99);
    setRoot((prevRoot) => insert(prevRoot, value));
    setErrorMessage(""); // Limpiar error previo al insertar aleatoriamente
  };

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    const parsed = parseInt(searchTerm, 10);
    const result = search(root, parsed);
    setFoundNode(result ? result.value : null);
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const d3Data = root ? toD3Format(root) : null;

  // FIX BUG #5 (Performance): useCallback memoiza la función para que no se
  // recree en cada render. Solo se recrea si root o activeTraversal cambian.
  const getTraversalResult = useCallback((type) => {
    switch (type) {
      case "inOrder": return inOrder(root);
      case "preOrder": return preOrder(root);
      case "postOrder": return postOrder(root);
      default: return [];
    }
  }, [root]);

  // FIX BUG #5 (cont.): useMemo hace que traversalResult solo se recalcule
  // cuando root o activeTraversal cambian, no en cada render.
  const traversalResult = useMemo(
    () => (activeTraversal ? getTraversalResult(activeTraversal) : []),
    [activeTraversal, getTraversalResult]
  );

  // ── Node Rendering ──────────────────────────────────────────────────────────
  /**
   * FIX: Resaltar el nodo encontrado por la búsqueda con un color distinto.
   * Si nodeDatum.name coincide con foundNode, el círculo cambia a naranja
   * y agrega un anillo exterior para mayor visibilidad.
   */
  const renderCustomNode = useCallback(({ nodeDatum }) => {
    const isFound = String(foundNode) === nodeDatum.name;

    return (
      <g>
        {/* Anillo exterior solo para el nodo encontrado */}
        {isFound && (
          <circle
            r={26}
            fill="none"
            stroke="#F5A623"
            strokeWidth={3}
            opacity={0.8}
          />
        )}

        {/* Círculo principal: naranja si es el nodo encontrado, azul si no */}
        <circle
          r={22}
          fill={isFound ? "#F5A623" : "#4A90D9"}
          stroke="#fff"
          strokeWidth={2}
        />

        <text
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={nodeDatum.name.length > 2 ? 10 : 13}
          fontWeight="500"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {nodeDatum.name}
        </text>
      </g>
    );
  }, [foundNode]); // Solo se recrea cuando cambia el nodo encontrado

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>BST Visualizer</h1>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.inputGroup}>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInsert()}
            placeholder="Ingresa un número..."
            className={styles.input}
          />
          <button onClick={handleInsert} className={styles.button}>
            Insertar
          </button>
          <button onClick={handleRandomInsert} className={`${styles.button} ${styles.secondary}`}>
            🎲 Aleatorio
          </button>
        </div>

        {/* FIX BUG #6: Mostrar mensaje de error cuando el input sea inválido */}
        {errorMessage && (
          <p className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}

        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={handleSearch}
          result={foundNode}
        />
      </div>

      {/* Traversal Selector */}
      <TraversalPanel
        active={activeTraversal}
        onChange={setTraversal}
        result={traversalResult}
      />

      {/* Tree Visualization */}
      <div className={styles.treeContainer}>
        {d3Data ? (
          <Tree
            data={d3Data}
            orientation="vertical"
            renderCustomNodeElement={renderCustomNode}
            separation={{ siblings: 1.5, nonSiblings: 2 }}
            translate={{ x: 400, y: 60 }}
          />
        ) : (
          <div className={styles.emptyState}>
            <p>El árbol está vacío.</p>
            <p>Inserta un número para comenzar.</p>
          </div>
        )}
      </div>
    </div>
  );
}