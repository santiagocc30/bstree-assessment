/**
 * Binary Search Tree - Core Data Structure
 *
 * ⚠️  NOTA PARA EL ESTUDIANTE:
 * Este archivo contiene la lógica central del BST.
 * Hay errores intencionales que debes encontrar y corregir.
 * Lee cada función con cuidado antes de modificar.
 */

// ─── Node Factory ────────────────────────────────────────────────────────────

/**
 * Crea un nodo para el BST.
 * @param {number} value
 * @returns {{ value: number, left: null, right: null }}
 */
export const createNode = (value) => ({
  value,
  left: null,
  right: null,
});

// ─── Core Operations ─────────────────────────────────────────────────────────

/**
 * Inserta un valor en el árbol.
 *
 * FIXES:
 *   BUG #1: La segunda condición era duplicada (value > node.value) y nunca
 *           insertaba a la izquierda. Corregido a (value < node.value).
 *   BUG #2: El caso node === null ya estaba manejado correctamente con
 *           createNode(value); el verdadero problema era que el llamador
 *           debía asignar el retorno: root = insert(root, value).
 *           Se agrega un comentario explícito para dejar esto claro.
 *
 * @param {object|null} node - Nodo raíz del subárbol actual
 * @param {number} value - Valor a insertar
 * @returns {object} - Nuevo subárbol con el valor insertado
 *
 * IMPORTANTE: Siempre asigna el valor de retorno:
 *   root = insert(root, value)
 */
export const insert = (node, value) => {
  // Caso base: posición vacía → crear nodo nuevo
  if (node === null) {
    return createNode(value);
  }

  // FIX BUG #1: ir a la izquierda cuando value < node.value
  if (value < node.value) {
    return {
      ...node,
      left: insert(node.left, value),
    };
  }

  // Ir a la derecha cuando value > node.value
  if (value > node.value) {
    return {
      ...node,
      right: insert(node.right, value),
    };
  }

  // Duplicado: retornar el nodo sin cambios
  return node;
};

/**
 * Busca un valor en el árbol.
 *
 * FIX BUG #3: Reemplazado == por === para evitar coerción de tipos.
 * search(root, "5") ya no encontrará el nodo con valor numérico 5.
 *
 * @param {object|null} node
 * @param {number} value
 * @returns {object|null} - El nodo encontrado, o null
 */
export const search = (node, value) => {
  if (node === null) return null;

  // FIX BUG #3: usar === en lugar de ==
  if (node.value === value) return node;

  if (value < node.value) {
    return search(node.left, value);
  }

  return search(node.right, value);
};

// ─── Traversals ──────────────────────────────────────────────────────────────

/**
 * Recorrido In-Order (izquierda → raíz → derecha).
 * En un BST válido, produce los valores en orden ascendente.
 *
 * @param {object|null} node
 * @returns {number[]}
 */
export const inOrder = (node) => {
  if (node === null) return [];

  return [
    ...inOrder(node.left),   // 1. Recorrer subárbol izquierdo
    node.value,               // 2. Visitar raíz
    ...inOrder(node.right),  // 3. Recorrer subárbol derecho
  ];
};

/**
 * Recorrido Pre-Order (raíz → izquierda → derecha).
 * Útil para serializar/clonar el árbol.
 *
 * @param {object|null} node
 * @returns {number[]}
 */
export const preOrder = (node) => {
  if (node === null) return [];

  return [
    node.value,               // 1. Visitar raíz
    ...preOrder(node.left),  // 2. Recorrer subárbol izquierdo
    ...preOrder(node.right), // 3. Recorrer subárbol derecho
  ];
};

/**
 * Recorrido Post-Order (izquierda → derecha → raíz).
 * Útil para eliminar el árbol o calcular tamaños de subárboles.
 *
 * @param {object|null} node
 * @returns {number[]}
 */
export const postOrder = (node) => {
  if (node === null) return [];

  return [
    ...postOrder(node.left),  // 1. Recorrer subárbol izquierdo
    ...postOrder(node.right), // 2. Recorrer subárbol derecho
    node.value,                // 3. Visitar raíz
  ];
};

// ─── Tree Transformation ─────────────────────────────────────────────────────

/**
 * Transforma la estructura interna del BST al formato que espera react-d3-tree.
 *
 * react-d3-tree espera: { name: string, children: Array }
 * Nuestra estructura interna es: { value: number, left: Node|null, right: Node|null }
 *
 * FIX BUG #4: Antes, si un nodo solo tenía hijo derecho (sin hijo izquierdo),
 * el hijo derecho se ignoraba por completo. Ahora cada hijo se agrega de forma
 * independiente, sin importar si el otro existe.
 *
 * @param {object|null} node
 * @returns {object|null} - Nodo en formato react-d3-tree, o null
 */
export const toD3Format = (node) => {
  if (node === null) return null;

  const children = [];

  // FIX BUG #4: agregar cada hijo de forma independiente
  if (node.left !== null) {
    children.push(toD3Format(node.left));
  }

  if (node.right !== null) {
    children.push(toD3Format(node.right));
  }

  return {
    name: String(node.value),
    children,
  };
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Calcula la altura del árbol.
 * La altura se define como el número de aristas en el camino más largo
 * desde la raíz hasta una hoja. Un árbol vacío tiene altura -1;
 * un árbol de un solo nodo tiene altura 0.
 *
 * @param {object|null} node
 * @returns {number}
 */
export const getHeight = (node) => {
  // Árbol vacío
  if (node === null) return -1;

  // Altura = 1 + el máximo entre la altura del subárbol izquierdo y derecho
  return 1 + Math.max(getHeight(node.left), getHeight(node.right));
};

/**
 * Genera un número entero aleatorio entre min y max (inclusivo).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;