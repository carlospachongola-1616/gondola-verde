/* =========================================================
   Góndola Verde - CRUD de productos veganos
   Los datos se guardan en el navegador con localStorage.
   ========================================================= */

// Nombre de la "tabla" dentro de localStorage
const CLAVE_STORAGE = 'gondolaVerde_productos';

// Productos de ejemplo para la primera vez que se abre la app
const PRODUCTOS_INICIALES = [
  { id: 1, nombre: 'Leche de almendras', marca: 'Naturela', categoria: 'Lácteos vegetales', precio: 12900, stock: 24, vencimiento: '2027-03-15', certificado: true },
  { id: 2, nombre: 'Tofu firme', marca: 'Soya Viva', categoria: 'Proteínas vegetales', precio: 9500, stock: 4, vencimiento: '2026-12-10', certificado: true },
  { id: 3, nombre: 'Chips de plátano', marca: 'Huila Snacks', categoria: 'Snacks', precio: 4200, stock: 40, vencimiento: '2027-05-01', certificado: false }
];

// ---------- Referencias a elementos del HTML ----------
const form = document.getElementById('formProducto');
const campos = {
  id: document.getElementById('productoId'),
  nombre: document.getElementById('nombre'),
  marca: document.getElementById('marca'),
  categoria: document.getElementById('categoria'),
  precio: document.getElementById('precio'),
  stock: document.getElementById('stock'),
  vencimiento: document.getElementById('vencimiento'),
  certificado: document.getElementById('certificado')
};
const tituloFormulario = document.getElementById('tituloFormulario');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');
const mensajeError = document.getElementById('mensajeError');
const tabla = document.getElementById('tablaProductos');
const contador = document.getElementById('contador');
const vacio = document.getElementById('vacio');
const buscador = document.getElementById('buscador');
const filtroCategoria = document.getElementById('filtroCategoria');
const aviso = document.getElementById('aviso');

/* =========================================================
   Capa de datos (localStorage)
   ========================================================= */

/** Lee todos los productos guardados. Si no hay nada, carga los de ejemplo. */
function obtenerProductos() {
  const datos = localStorage.getItem(CLAVE_STORAGE);
  if (datos === null) {
    guardarProductos(PRODUCTOS_INICIALES);
    return [...PRODUCTOS_INICIALES];
  }
  return JSON.parse(datos);
}

/** Guarda la lista completa de productos. */
function guardarProductos(productos) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(productos));
}

/* =========================================================
   CREATE - Crear un producto nuevo
   ========================================================= */
function crearProducto(datos) {
  const productos = obtenerProductos();
  const nuevo = { id: Date.now(), ...datos }; // Date.now() sirve como id único
  productos.push(nuevo);
  guardarProductos(productos);
  mostrarAviso(`"${nuevo.nombre}" se agregó al inventario`);
}

/* =========================================================
   READ - Leer y mostrar los productos (con búsqueda y filtro)
   ========================================================= */
function mostrarProductos() {
  const texto = buscador.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;

  const productos = obtenerProductos().filter(p => {
    const coincideTexto = p.nombre.toLowerCase().includes(texto) || p.marca.toLowerCase().includes(texto);
    const coincideCategoria = categoria === '' || p.categoria === categoria;
    return coincideTexto && coincideCategoria;
  });

  // Se arma una fila por producto
  tabla.innerHTML = productos.map(p => `
    <tr>
      <td><strong>${escaparHTML(p.nombre)}</strong><span class="marca">${escaparHTML(p.marca)}</span></td>
      <td>${p.categoria}</td>
      <td>${formatearPrecio(p.precio)}</td>
      <td class="${p.stock <= 5 ? 'stock-bajo' : ''}">${p.stock}${p.stock <= 5 ? ' ⚠️' : ''}</td>
      <td class="${estaVencido(p.vencimiento) ? 'vencido' : ''}">${formatearFecha(p.vencimiento)}</td>
      <td><span class="etiqueta ${p.certificado ? 'si' : 'no'}">${p.certificado ? '✔ Vegano' : 'Sin sello'}</span></td>
      <td>
        <div class="acciones">
          <button class="btn btn-editar" onclick="cargarParaEditar(${p.id})">✏️ Editar</button>
          <button class="btn btn-eliminar" onclick="eliminarProducto(${p.id})">🗑️ Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');

  contador.textContent = productos.length;
  vacio.classList.toggle('oculto', productos.length > 0);
}

/* =========================================================
   UPDATE - Editar un producto existente
   ========================================================= */

/** Pasa los datos del producto al formulario y cambia a "modo edición". */
function cargarParaEditar(id) {
  const producto = obtenerProductos().find(p => p.id === id);
  if (!producto) return;

  mensajeError.textContent = ''; // se limpia cualquier error anterior
  campos.id.value = producto.id;
  campos.nombre.value = producto.nombre;
  campos.marca.value = producto.marca;
  campos.categoria.value = producto.categoria;
  campos.precio.value = producto.precio;
  campos.stock.value = producto.stock;
  campos.vencimiento.value = producto.vencimiento;
  campos.certificado.checked = producto.certificado;

  tituloFormulario.textContent = 'Editar producto';
  btnGuardar.textContent = 'Actualizar producto';
  btnCancelar.classList.remove('oculto');
  campos.nombre.focus();
}

/** Reemplaza el producto con ese id por los datos nuevos. */
function actualizarProducto(id, datos) {
  const productos = obtenerProductos().map(p => (p.id === id ? { id, ...datos } : p));
  guardarProductos(productos);
  mostrarAviso(`"${datos.nombre}" se actualizó correctamente`);
}

/* =========================================================
   DELETE - Eliminar un producto
   ========================================================= */
function eliminarProducto(id) {
  const producto = obtenerProductos().find(p => p.id === id);
  if (!producto) return;

  // Se pide confirmación para evitar borrar por accidente
  if (!confirm(`¿Seguro que quieres eliminar "${producto.nombre}"?`)) return;

  guardarProductos(obtenerProductos().filter(p => p.id !== id));
  // Si justo se estaba editando ese producto, se limpia el formulario
  if (Number(campos.id.value) === id) limpiarFormulario();
  mostrarProductos();
  mostrarAviso(`"${producto.nombre}" se eliminó del inventario`, true);
}

/* =========================================================
   Formulario: validación y envío
   ========================================================= */

/** Lee los campos del formulario y devuelve un objeto producto. */
function leerFormulario() {
  return {
    nombre: campos.nombre.value.trim(),
    marca: campos.marca.value.trim(),
    categoria: campos.categoria.value,
    precio: Number(campos.precio.value),
    stock: Number(campos.stock.value),
    vencimiento: campos.vencimiento.value,
    certificado: campos.certificado.checked
  };
}

/** Revisa que los datos sean válidos. Devuelve un mensaje de error o '' si todo está bien. */
function validar(datos) {
  if (!datos.nombre || !datos.marca || !datos.categoria) return 'Completa el nombre, la marca y la categoría.';
  if (campos.precio.value === '' || datos.precio < 0) return 'El precio debe ser un número mayor o igual a 0.';
  if (campos.stock.value === '' || datos.stock < 0 || !Number.isInteger(datos.stock)) return 'El stock debe ser un número entero mayor o igual a 0.';
  return '';
}

form.addEventListener('submit', evento => {
  evento.preventDefault(); // evita que la página se recargue

  const datos = leerFormulario();
  const error = validar(datos);
  mensajeError.textContent = error;
  if (error) return;

  const id = Number(campos.id.value);
  if (id) {
    actualizarProducto(id, datos); // si hay id, estamos editando
  } else {
    crearProducto(datos);          // si no hay id, es un producto nuevo
  }

  limpiarFormulario();
  mostrarProductos();
});

btnCancelar.addEventListener('click', limpiarFormulario);

/** Deja el formulario vacío y en "modo crear". */
function limpiarFormulario() {
  form.reset();
  campos.id.value = '';
  mensajeError.textContent = '';
  tituloFormulario.textContent = 'Agregar producto';
  btnGuardar.textContent = 'Guardar producto';
  btnCancelar.classList.add('oculto');
}

/* =========================================================
   Utilidades
   ========================================================= */
function formatearPrecio(valor) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

function estaVencido(fecha) {
  if (!fecha) return false;
  return new Date(fecha + 'T23:59:59') < new Date();
}

/** Evita que un texto escrito por el usuario se interprete como HTML. */
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

let temporizadorAviso;
function mostrarAviso(mensaje, esPeligro = false) {
  aviso.textContent = mensaje;
  aviso.classList.toggle('peligro', esPeligro);
  aviso.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove('visible'), 2500);
}

// Búsqueda y filtro en tiempo real
buscador.addEventListener('input', mostrarProductos);
filtroCategoria.addEventListener('change', mostrarProductos);

// Al abrir la página se muestran los productos
mostrarProductos();
