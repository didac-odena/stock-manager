# Guion Demo 10 Min — Stock Manager

## Bloque 1
**Guion literal:**  
Buenas. La idea no es vender un producto comercial, sino mostrar un flujo full-stack realista y explicar bien las decisiones que hay detrás.  
  
La app es Stock Manager y tiene dos caras: catálogo público para invitados y panel privado para administración de productos y stock.  
  
A nivel de estructura, está separada en `web` y `api` para trabajar frontend y backend de forma integrada. En `web` tengo React con Vite, y en `api` tengo Express con MongoDB. Toda la lógica de negocio sale por rutas bajo `/api`, y el frontend consume esos endpoints con servicios Axios.  
    


## Bloque 2 INVITADO
**Guion literal:**  
Empiezo por el flujo invitado, que es totalmente público. Desde Home entro en catálogo sin autenticación. Aquí hay una primera decisión técnica: la Home carga categorías y productos destacados en paralelo con `Promise.all`, en vez de hacer una petición detrás de otra.  
  
Ahora en catálogo, el estado de navegación está en la URL. Cuando filtro, busco o cambio de página, se actualizan `category`, `search` y `page`. Esto permite compartir enlace, mantener contexto y no perder filtros al refrescar.  
  
La búsqueda además tiene debounce, así que no dispara una petición por cada tecla instantáneamente. Espera unas décimas, agrupa cambios y reduce ruido de red.  
  
Si abro un producto, se ve una regla de negocio clara: como invitado no veo el número exacto de unidades, solo disponibilidad, por ejemplo “Available” o “Out of stock”. El stock exacto queda para el flujo admin.  
  
Bajo a reviews y envío una valoración. Este endpoint es público porque aquí los visitantes no tienen cuenta. Pero no es abierto sin control: en base de datos hay un índice único para `email + product`, así que no se puede valorar dos veces el mismo producto con el mismo email.  
  
Con este bloque se ve que el modo invitado no es solo una capa visual: hay decisiones de datos, de rendimiento y de límites funcionales funcionando de verdad.  

## Bloque 3 ADMIN
**Guion literal:**  
Ahora paso al flujo admin. Entro en login con una cuenta de administración. Técnicamente, al hacer submit, backend valida credenciales con `bcrypt` y, si son correctas, emite un JWT. Ese token no se guarda en localStorage: se guarda en cookie `httpOnly`, con duración de siete días.
  
Además, el frontend trabaja con `withCredentials: true` para que la cookie viaje en las peticiones a API. Y al cargar la app se restaura sesión con `GET /api/me`, que es lo que evita “desloguearte” visualmente al refrescar.  
  
Ya dentro, estoy en `/admin/products`, zona privada. Aquí hay doble barrera: `PrivateRoute` en frontend y `isAuthenticated` en backend verificando JWT antes de ejecutar controladores.  
  
Desde esta tabla hago CRUD completo: crear, editar y borrar producto. También hay búsqueda operativa para filtrar rápido. Y aquí sí se ve el stock exacto, porque ya estoy autenticado.  
  
Voy a perfil de admin. Se puede cambiar nombre y también contraseña. Para contraseña no basta con enviar la nueva: se pide contraseña actual y se valida antes de guardar.  
  
Este bloque resume la capa de auth completa: login, sesión persistente, rutas privadas y control de acceso real en cliente y servidor.  

## Bloque 4 
**Guion literal:**  
Aquí enseño dos funcionalidades diferenciales: escaneo de barcode y subida de imágenes.  
  
Primero, escáner en página dedicada. Esta vistaSLIM usa `react-zxing` para leer cámara en navegador, detectar código y lanzar búsqueda del producto asociado. Si encuentra coincidencia, muestra datos y permite saltar a edición.  
  
Esa búsqueda no es pública. El endpoint `GET /api/products/barcode/:barcode` está protegido porque es funcionalidad interna de inventario.  
  
Después entro en el formulario de producto. Aquí el escaneo también está embebido, para rellenar el barcode sin salir del formulario y evitar errores de tecleo manual.  
  
En esta misma pantalla enseño imágenes. El frontend envía `FormData`; backend recibe con Multer y sube a Cloudinary. El límite está en tres imágenes por producto, tanto en ruta como en validación de modelo.  
  
Y hay una decisión de calidad importante: si falla una operación de escritura después de subir imágenes, backend intenta borrar esos recursos en Cloudinary para no dejar archivos huérfanos.  
  
Este tipo de detalle no se ve en la UI, pero en backend marca mucho la diferencia cuando trabajas con almacenamiento externo.  

## Bloque 5
**Guion literal:**  
Antes de cerrar, explico método y despliegue. El proyecto se trabajó por iteraciones diarias: primero bloque teórico, después implementación práctica sobre el mismo repo.  
  
Esa progresión está documentada en `tareas` y en `docs/DEVLOG.md`, donde se ve qué se añadió, qué falló y qué se corrigió en cada fase.  
  
También usé IA como apoyo para estructurar tareas, detectar bloqueos y acelerar iteración, pero siempre validando contra ejecución real de la app y dejando trazabilidad.  
  
En despliegue, quedó publicado en Fly con Docker. Se usó build multi-stage para construir frontend y servirlo desde Express en producción junto con la API.  
  
Y aquí hubo una decisión técnica concreta: usar `node:20-slim` en lugar de Alpine para reducir fricción con dependencias nativas como `bcrypt`. En este contexto prioricé estabilidad operativa sobre imagen más pequeña.  
  
Con esto cierro proceso: no solo hay funcionalidades, también hay método, documentación y despliegue real.  

## Bloque 6
**Guion literal:**  
Para cerrar, Este proyecto demuestra un flujo full-stack completo: autenticación con cookies, modelado relacional en MongoDB, catálogo público, panel admin con CRUD, reviews, escaneo por barcode, subida de imágenes y despliegue real.  
  
También cierro con límites reales, porque es un proyecto académico y prefiero ser transparente. Uno: no hay suite automática de tests integrada en scripts; la validación se apoyó sobre todo en Postman y pruebas manuales guiadas. Dos: no hay pantalla frontend dedicada para gestión de invitaciones; el flujo está en API y se puede explicar técnicamente, pero no se opera desde una vista específica. Tres: hay detalles legacy en seed/devlog que se fueron corrigiendo, y por eso mantuve trazabilidad documental durante todo el proceso.  
  
Si lo continuara en una iteración siguiente, priorizaría tests automáticos y cierre de esos puntos de producto. Pero para el objetivo de fin de bootcamp, que era integrar backend, frontend y despliegue en un flujo coherente, el resultado está conseguido y defendible.  
**Punto técnico defendible:** el proyecto cubre el flujo técnico extremo a extremo con límites reconocidos explícitamente, lo que permite una defensa honesta y sólida en contexto de bootcamp.