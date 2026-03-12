# Dia 18 — Escaner de codigo de barras movil

> Objetivo: implementar una pagina en el panel admin que usa la camara del movil para escanear codigos de barras y buscar el producto correspondiente, usando la libreria `react-zxing`.

---

## Estudio (~45min)

### Por que un escaner en el frontend

El campo `barcode` en el modelo Product permite vincular cada producto con su codigo de barras fisico. Sin embargo, escribir barcodes a mano es propenso a errores. Con la camara del movil, el admin puede:
1. Abrir `/admin/barcode` en el movil.
2. Apuntar la camara al codigo de barras del producto.
3. La app detecta el codigo y muestra el producto automaticamente.
4. Desde ahi, puede editarlo (actualizar stock, precio, etc.).

### Permisos de camara en el navegador

Los navegadores modernos protegen el acceso a la camara. Solo se puede acceder a ella:
1. En sitios servidos por HTTPS (o `localhost` en desarrollo).
2. Con el permiso explicito del usuario — el navegador muestra un dialogo.

Si el usuario deniega el permiso, la camara no se activa y `react-zxing` lanza un error. En nuestro caso simplemente no mostramos nada (el catch lo silencia).

En produccion (Netlify), la app va por HTTPS, por lo que el escaner funcionara. En desarrollo (`localhost`), tambien funciona porque los navegadores eximen `localhost` de la restriccion HTTPS.

### react-zxing — libreria de escaneo

`react-zxing` es un wrapper de React para la libreria ZXing (Zebra Crossing), que soporta multiples formatos de codigos de barras (EAN-13, EAN-8, QR, Code128...).

Uso basico:

```jsx
import { useZxing } from "react-zxing";

function Scanner() {
  const { ref } = useZxing({
    onDecodeResult(result) {
      console.log(result.getText());  // el codigo escaneado
    },
  });

  return <video ref={ref} />;
}
```

El hook `useZxing` devuelve un `ref` que se adjunta a un elemento `<video>`. La libreria gestiona el acceso a la camara automaticamente — solicita el permiso, activa el stream de video y analiza cada fotograma buscando codigos de barras.

La prop `paused` permite pausar el escaneo sin desmontar el componente:
```jsx
const { ref } = useZxing({
  paused: !scanning,  // si scanning es false, la camara se pausa
  onDecodeResult(result) { ... },
});
```

Esto es util para pausar despues de detectar un codigo (para que no siga disparando el evento) y reactivar cuando el usuario quiere escanear otro.

### Flujo de la pagina

```
1. Camara activa → video en pantalla
2. Usuario apunta al barcode
3. react-zxing detecta el codigo → llama onDecodeResult
4. Llamamos a getProductByBarcode(code) → backend /api/products/barcode/:code
5. Mostramos el producto encontrado
6. Si no existe → mensaje "Producto no encontrado"
7. Boton "Editar" → navega a /admin/products/:id/edit
```

### Instalacion

```bash
cd web
npm install react-zxing
```

---

## Tareas (~2.5h)

### Tarea 1 — Instalar react-zxing (~5min)

```bash
cd web
npm install react-zxing
```

### Tarea 2 — Anadir getProductByBarcode al servicio (~10min)

Asegurate de que `web/src/services/products.service.js` exporta la funcion para buscar por barcode:

```js
export function getProductByBarcode(barcode) {
  return http.get(`/products/barcode/${encodeURIComponent(barcode)}`);
}
```

### Tarea 3 — Registrar la ruta y anadir enlace al sidebar (~15min)

**3a. Actualizar `web/src/App.jsx`:**

Añade el import de `AdminBarcodePage` y su ruta dentro del bloque de rutas admin:

```jsx
import AdminBarcodePage from "./pages/AdminBarcodePage";

// Dentro del bloque de rutas admin (PrivateRoute > AdminLayout):
<Route path="/admin/barcode" element={<AdminBarcodePage />} />
```

**3b. Actualizar `web/src/components/layout/AdminLayout.jsx`:**

Añade el enlace al escaner entre Productos y Perfil en el nav:

```jsx
<NavLink to="/admin/barcode" className={linkClasses}>
  Escaner
</NavLink>
```

### Tarea 4 — Implementar AdminBarcodePage (~1.5h)

Crea `web/src/pages/AdminBarcodePage.jsx`:

```jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useZxing } from "react-zxing";
import { getProductByBarcode } from "../services/products.service";

function AdminBarcodePage() {
  const [scanning, setScanning] = useState(true);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [lastCode, setLastCode] = useState("");

  const { ref } = useZxing({
    paused: !scanning,
    onDecodeResult(result) {
      const code = result.getText();

      // Evitar procesar el mismo codigo repetidamente
      if (code === lastCode) return;
      setLastCode(code);
      setScanning(false);

      handleBarcode(code);
    },
  });

  async function handleBarcode(code) {
    try {
      setError("");
      setProduct(null);
      const found = await getProductByBarcode(code);
      setProduct(found);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No se encontro ningun producto con el codigo: ${code}`);
      } else {
        setError("Error al buscar el producto");
      }
    }
  }

  function handleReset() {
    setScanning(true);
    setProduct(null);
    setError("");
    setLastCode("");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Escaner de barcode
      </h1>

      {/* Camara */}
      {scanning && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">
            Apunta la camara al codigo de barras del producto.
          </p>
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
            <video ref={ref} className="w-full" />
          </div>
        </div>
      )}

      {/* Resultado */}
      {product && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex gap-4 items-start">
            {product.images.length > 0 && (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-20 h-20 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {product.name}
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                Categorias: {product.categories.join(", ") || "—"}
              </p>
              <p className="text-sm text-gray-500 mb-1">
                Stock: <span className={`font-medium ${product.stock === 0 ? "text-red-500" : "text-gray-900"}`}>{product.stock}</span>
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Precio: <span className="font-medium text-gray-900">{product.price.toFixed(2)} EUR</span>
              </p>
              <Link
                to={`/admin/products/${product.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 inline-block"
              >
                Editar producto
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Boton para volver a escanear */}
      {!scanning && (
        <button
          onClick={handleReset}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          Escanear otro
        </button>
      )}
    </div>
  );
}

export default AdminBarcodePage;
```

### Tarea 5 — Probar el escaner (~30min)

**En el movil (recomendado):**
1. Asegurate de que el servidor de desarrollo esta accesible en la red local (Vite suele usar `http://192.168.x.x:5173`).
2. Abre esa URL en el movil con un navegador moderno.
3. Haz login → navega a "Escaner" en el sidebar.
4. Acepta el permiso de camara cuando el navegador lo pida.
5. Apunta al codigo de barras de cualquier producto que hayas creado con barcode.
6. Debe aparecer la info del producto y el boton "Editar".

**En el escritorio:**
1. Navega a `/admin/barcode`.
2. El navegador pedira acceso a la camara del ordenador.
3. Puedes probar con un codigo de barras en papel o en la pantalla de otro dispositivo.

**Probar caso de barcode no existente:**
- Apunta a un codigo de barras de cualquier objeto (caja, libro...) que no este en tu base de datos.
- Debe mostrar el mensaje "No se encontro ningun producto...".

---

## Refuerzo (~30min)

- Piensa en el flujo real del admin de una tienda: llega con el movil, escanea un producto que necesita actualizar, lo edita directamente desde el movil.
- Si tienes varios productos con barcode, prueba a escanear distintos y verifica que cada uno muestra el producto correcto.
- Verifica que el boton "Escanear otro" reinicia correctamente la camara y borra el resultado anterior.

---

## Checklist

- [ ] `react-zxing` instalado en el proyecto web
- [ ] `getProductByBarcode` anadido al servicio de productos
- [ ] Enlace "Escaner" anadido al sidebar de AdminLayout
- [ ] Ruta `/admin/barcode` registrada en App.jsx
- [ ] AdminBarcodePage con video de camara
- [ ] Al detectar barcode, llama al backend y muestra el producto
- [ ] Producto encontrado muestra: imagen, nombre, categorias, stock, precio
- [ ] Boton "Editar producto" navega al formulario de edicion
- [ ] Producto no encontrado muestra mensaje de error claro
- [ ] Boton "Escanear otro" reinicia el escaner
- [ ] Funciona en movil (camara trasera)
