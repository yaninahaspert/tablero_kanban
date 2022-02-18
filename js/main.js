let draggable;
let objetoMovido;
let editando;

document.addEventListener('DOMContentLoaded', () => {
    crearDB();
});

function crearDB() {
    const crearDB = window.indexedDB.open('tableros', 1);

    crearDB.onerror = function () {
        console.log('Hubo un error');
    }

    crearDB.onsuccess = function () {
        console.log('Base de datos lista!');
        let DB = crearDB.result;
        imprimirHTML(DB);
        agregarEventListenerABotonAgregar(DB)
        agregarEventListenerACajas(DB)
    }
    crearDB.onupgradeneeded = function (e) {
        const db = e.target.result;

        const objectStore1 = db.createObjectStore('kanban', {keyPath: 'id', autoIncrement: true});
        objectStore1.createIndex('id', 'id', {unique: true});
        objectStore1.createIndex('homework', 'homework', {unique: false});
        objectStore1.createIndex('description', 'description', {unique: false});
        objectStore1.createIndex('estado', 'estado', {unique: false});
        console.log('almacen creado y listo');
    }
}

let homeworkObj = {
    homework: "",
    description: "",
    estado: "",
    id: ""
}

function agregarEventListenerABotonAgregar(DB) {
    document.getElementById("botonAgregar").addEventListener("click", function (e) {
        e.preventDefault()

        homeworkObj.homework = document.getElementById("tareas").value.trim();
        homeworkObj.description = document.getElementById("descripcion").value.trim();

        let selector = document.getElementById("mySelect").value;

        if (selector === "1") {
            homeworkObj.estado = "1"
        } else if (selector === "2") {
            homeworkObj.estado = "2"
        } else if (selector === "3") {
            homeworkObj.estado = "3"
        }

        if (validarCampos(homeworkObj)) {
            agregarTarea(homeworkObj, DB)
            limpiarFormulario()
        } else {
            imprimirAlerta("Todos los campos son obligatorios", 'error')
        }

    });
}

function agregarEventListenerACajas(DB) {
    let cajasTodas = document.querySelectorAll('.status')

    cajasTodas.forEach((status) => {
        status.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
        status.addEventListener("drop", (e) => {
            status.appendChild(draggable);

            if (status.id === 'caja1') {
                objetoMovido.estado = '1';
            } else if (status.id === 'caja2') {
                objetoMovido.estado = '2';
            } else {
                objetoMovido.estado = '3';
            }

            actualizarHomeworkEnDB(objetoMovido, DB);
        });
    });
}

function validarCampos(homeworkObj) {
    if (homeworkObj.homework === '' || homeworkObj.description === '' || homeworkObj.estado === '') {
        return false;
    } else {
        return true;
    }
}

function limpiarFormulario() {
    document.getElementById("formulario").reset();
}

document.getElementById("botonLimpiar").addEventListener("clic", limpiarFormulario)


function imprimirAlerta(mensaje, tipo) {
    let formulario = document.querySelector("#espacioAlerta")

    const divMensaje = document.createElement('div');
    divMensaje.classList.add("px-4", "py-3", "max-w-lg", "mx-auto", "mt-6", "text-center");

    if (tipo === 'error') {
        divMensaje.classList.add("bg-danger", "text-white");
    } else {
        divMensaje.classList.add("bg-success", "text-white");
    }
    divMensaje.textContent = mensaje
    formulario.appendChild(divMensaje);

    setTimeout(() => {
        divMensaje.remove();
    }, 3000);
}


function agregarTarea(homeworkObj, DB) {
    if (editando) {
        const transaction = DB.transaction(['kanban'], 'readwrite');
        const objectStore = transaction.objectStore('kanban');

        objectStore.put(homeworkObj);

        transaction.oncomplete = () => {
            imprimirHTML(DB)
            imprimirAlerta("Editado Correctamente")
            document.getElementById("botonAgregar").textContent = 'AGREGAR';
            editando = false;
        }

        transaction.onerror = () => {
            console.log('Hubo un errorr.')
        }
    } else {
        homeworkObj.id = Date.now();

        const transaction = DB.transaction(['kanban'], 'readwrite');

        const objectStore = transaction.objectStore('kanban');
        objectStore.put(homeworkObj);

        transaction.oncomplete = () => {
            console.log('tarea Agregado');
            imprimirHTML(DB);
        };
        transaction.onerror = (e) => {
            console.log('Hubo un error!');
            imprimirAlerta('Hubo un Error', 'error');
        };
    }
}

function imprimirHTML(DB) {
    limpiarCaja1()
    limpiarCaja2()
    limpiarCaja3()
    const objectStore = DB.transaction(["kanban"]).objectStore('kanban');
    objectStore.openCursor().onsuccess = function (e) {
        const cursor = e.target.result;

        if (cursor === null) {
            return
        }

        let tarea = cursor.value;
        const {homework, descripton, estado, id} = tarea;

        const caja1 = document.querySelector('#caja1');
        const caja2 = document.querySelector('#caja2');
        const caja3 = document.querySelector('#caja3');
        let elemento = document.createElement("div");
        elemento.setAttribute("draggable", "true")
        let texto = document.createTextNode(homework);
        elemento.appendChild(texto);
        elemento.addEventListener("dragstart", dragStart);
        elemento.addEventListener("dragend", dragEnd);

        function dragStart() {
            objetoMovido = tarea;
            draggable = this;
        }

        function dragEnd() {
            objetoMovido = null;
            draggable = null;
        }

        if (estado === "1") {
            elemento.classList.add("nueva-tarea1");
            caja1.appendChild(elemento);
        } else if (estado === "2") {
            elemento.classList.add("nueva-tarea2");
            caja2.appendChild(elemento);
        } else if (estado === "3") {
            elemento.classList.add("nueva-tarea3");
            caja3.appendChild(elemento);
        }

        let boton = document.createElement("button")
        boton.classList.add("btn", "btn-outline-danger", "btn-sm", "posicion", "mx-1")
        let text = document.createTextNode("x")
        boton.appendChild(text)
        elemento.appendChild(boton)
        boton.onclick = () => {
            eliminarHomework(id, DB)
        }

        let editar = document.createElement("button")
        editar.classList.add("btn", "btn-outline-primary", "btn-sm", "posicion", "mx-1")
        let textEditar = document.createTextNode("Editar")
        editar.appendChild(textEditar)
        elemento.appendChild(editar)

        editar.onclick = () => {
            editarTarea(tarea)
        }
        cursor.continue();
    }
}

function limpiarCaja1() {
    document.querySelector('#caja1').innerHTML = '';
}

function limpiarCaja2() {
    document.querySelector('#caja2').innerHTML = '';
}

function limpiarCaja3() {
    document.querySelector('#caja3').innerHTML = '';
}


function eliminarHomework(id, DB) {

    const transaction = DB.transaction(['kanban'], 'readwrite');
    const objectStore = transaction.objectStore('kanban');
    objectStore.delete(id)
    transaction.oncomplete = () => {
        imprimirHTML(DB)

    }
    transaction.onerror = () => {
        console.log("error al eliminar")
    }

    limpiarCaja1()
    limpiarCaja2()
    limpiarCaja3()

}

function editarTarea(datos) {
    const {homework, description, estado, id} = datos;

    homeworkObj.id = id;

    document.querySelector('#tareas').value = homework;
    document.querySelector('#descripcion').value = description;
    document.querySelector("#mySelect").value = estado;

    document.getElementById("botonAgregar").innerText = 'Editar';

    editando = true;
}

function actualizarHomeworkEnDB(homeworkActualizado, DB) {
    const transaction = DB.transaction(['kanban'], 'readwrite');
    const objectStore = transaction.objectStore('kanban');
    objectStore.put(homeworkActualizado);

    transaction.oncomplete = () => {
        imprimirHTML(DB)
    };
    transaction.onerror = (e) => {
        console.log('Hubo un error!');
    };
}

     /*   fetch(`https://kanban-a332.restdb.io/rest/tasks/{this.id} `)

            .then( respuesta => respuesta.json())
            .then(resultado => {

            })
            .catch(error => console.log(error))

*/
if ("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js")
        .then(registrado=> console.log("se instalo corectamnete", registrado))
        .catch(error=>console.log("fallo la instalacion", error));
}else{
    console.log("service worker no soportado")
}