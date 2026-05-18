# BST Visualizer

Visualizador interactivo de Árbol Binario de Búsqueda (BST) construido con React + Vite. Permite insertar nodos, buscar valores y ver animaciones de los tres recorridos clásicos del árbol.

---

## Correcciones realizadas

### `src/utils/bst.js`

#### BUG #1 — Inserción siempre a la derecha (`insert`)

La segunda condición `if (value > node.value)` estaba duplicada, por lo que nunca se insertaba en el subárbol izquierdo.

```js
// Antes
if (value > node.value) { ... }  // rama derecha
if (value > node.value) { ... }  // duplicado — nunca insertaba a la izquierda

// Después
if (value < node.value) return { ...node, left: insert(node.left, value) };
if (value > node.value) return { ...node, right: insert(node.right, value) };
```

#### BUG #2 — Manejo del nodo `null` inicial (`insert`)

El caso base `if (node === null) return createNode(value)` era correcto internamente, pero el error real era que el llamador no asignaba el retorno. Sin `root = insert(root, value)` la raíz nunca se actualiza.

```js
// Incorrecto
insert(root, 10);

// Correcto
root = insert(root, 10);
```

#### BUG #3 — Coerción de tipos con `==` (`search`)

El operador `==` permite que `search(root, "5")` encuentre el nodo con valor numérico `5`. Corregido con `===`.

```js
// Antes
if (node.value == value) return node;

// Después
if (node.value === value) return node;
```

#### BUG #4 — `toD3Format` ignoraba el hijo derecho

Cuando un nodo tenía solo hijo derecho (sin hijo izquierdo), ese hijo nunca se agregaba al array `children`, rompiendo la visualización para secuencias como `10 → 15 → 20`.

```js
// Antes — node.right solo se agrega si node.left existe
if (node.left !== null) {
  children.push(toD3Format(node.left));
  if (node.right !== null) {
    children.push(toD3Format(node.right));
  }
}

// Después — cada hijo se evalúa de forma independiente
if (node.left  !== null) children.push(toD3Format(node.left));
if (node.right !== null) children.push(toD3Format(node.right));
```

---

### `src/components/BSTVisualizer.jsx`

#### BUG #5 — Performance: funciones recreadas en cada render

`getTraversalResult` se recreaba como función nueva en cada render. `traversalResult` se recalculaba aunque `root` y `activeTraversal` no hubieran cambiado. Se aplicaron `useCallback` y `useMemo`.

```jsx
// Antes
const getTraversalResult = (root, type) => { ... };  // nueva función en cada render
const traversalResult = activeTraversal ? getTraversalResult(root, activeTraversal) : [];

// Después
const getTraversalResult = useCallback((type) => {
  switch (type) {
    case "inOrder":   return inOrder(root);
    case "preOrder":  return preOrder(root);
    case "postOrder": return postOrder(root);
    default:          return [];
  }
}, [root]);

const traversalResult = useMemo(
  () => (activeTraversal ? getTraversalResult(activeTraversal) : []),
  [activeTraversal, getTraversalResult]
);
```

`renderCustomNode` también se envolvió en `useCallback([foundNode])` para evitar que `react-d3-tree` re-renderice todos los nodos del árbol en cada cambio de estado no relacionado.

#### BUG #6 — UX: input inválido se tragaba silenciosamente

Si el usuario escribía texto no numérico y presionaba Insertar, `parseInt` devolvía `NaN` y no ocurría nada — sin ningún feedback visual.

```jsx
// Antes — el error se ignoraba
if (!isNaN(parsed)) {
  setRoot((prevRoot) => insert(prevRoot, parsed));
}

// Después — se muestra mensaje de error
if (isNaN(parsed)) {
  setErrorMessage("⚠️ Por favor ingresa un número entero válido.");
  return;
}
```

Y en el JSX:

```jsx
{errorMessage && (
  <p className={styles.errorMessage} role="alert">
    {errorMessage}
  </p>
)}
```

Agrega esto en tu CSS module:

```css
.errorMessage {
  color: var(--color-text-danger, #e53e3e);
  font-size: 0.85rem;
  margin-top: 4px;
}
```

#### Mejora visual — resaltado del nodo encontrado (`renderCustomNode`)

El nodo que coincide con la búsqueda ahora se pinta de naranja y recibe un anillo exterior. El resto permanece en azul.

```jsx
const isFound = String(foundNode) === nodeDatum.name;

<circle r={22} fill={isFound ? "#F5A623" : "#4A90D9"} stroke="#fff" strokeWidth={2} />

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
```

---

## Funciones implementadas

### `inOrder(node)` — Izquierda → Raíz → Derecha

Produce los valores del árbol en orden ascendente.

```js
export const inOrder = (node) => {
  if (node === null) return [];
  return [...inOrder(node.left), node.value, ...inOrder(node.right)];
};
```

### `preOrder(node)` — Raíz → Izquierda → Derecha

Útil para serializar o clonar el árbol.

```js
export const preOrder = (node) => {
  if (node === null) return [];
  return [node.value, ...preOrder(node.left), ...preOrder(node.right)];
};
```

### `postOrder(node)` — Izquierda → Derecha → Raíz

Útil para eliminar nodos o calcular tamaños de subárboles.

```js
export const postOrder = (node) => {
  if (node === null) return [];
  return [...postOrder(node.left), ...postOrder(node.right), node.value];
};
```

### `getHeight(node)`

Retorna la altura del árbol. Un árbol vacío tiene altura `-1`; un árbol de un solo nodo tiene altura `0`.

```js
export const getHeight = (node) => {
  if (node === null) return -1;
  return 1 + Math.max(getHeight(node.left), getHeight(node.right));
};
```

---

## Solución al error de Vitest con jsdom

Al correr los tests con `npm run vitest`, puede aparecer este error:

```
Error: require() of ES Module @exodus/bytes/encoding-lite.js not supported
ERR_REQUIRE_ESM
```

Ocurre porque `jsdom` intenta cargar un módulo ESM con `require()`. Para pruebas de lógica pura como el BST no se necesita entorno DOM. La solución es cambiar el entorno a `node` en `vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
```



## Estructura del proyecto

```
src/
├── components/
│   ├── BSTVisualizer.jsx   # Componente principal — bugs #5 y #6 corregidos
│   ├── SearchBar.jsx
│   └── TraversalPanel.jsx
└── utils/
    └── bst.js              # Lógica del BST — bugs #1 al #4 corregidos
```

---

## Correr el proyecto

```bash
npm install
npm run dev       # Inicia el servidor en http://localhost:5173
npm run test      # Corre los tests con Vitest
```
Claude colaboró en las siguientes tareas:

- Identificación y corrección de los 6 bugs intencionales en `bst.js` y `BSTVisualizer.jsx`
- Implementación de las funciones de recorrido `inOrder`, `preOrder`, `postOrder` y `getHeight`
- Aplicación de buenas prácticas de rendimiento en React con `useCallback` y `useMemo`
- Diagnóstico y solución del error `ERR_REQUIRE_ESM` en el entorno de pruebas de Vitest
- Mejoras de UX como el manejo de entradas inválidas (`NaN`) y el resaltado visual del nodo encontrado en la búsqueda
- Mejora tipográfica de los nodos en la visualización del árbol

El código fue revisado y validado.