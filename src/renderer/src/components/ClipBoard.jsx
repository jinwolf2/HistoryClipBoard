import React, { useState, useEffect } from 'react';
import { IoTrashOutline, IoClose } from 'react-icons/io5';

export default function ClipboardHome() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Este callback manejará el texto copiado al portapapeles.
    const handleTextChange = (newText) => {
      // Añadir el texto al estado si no está ya presente.
      setItems((prevItems) => {
        if (!prevItems.includes(newText)) {
          return [newText, ...prevItems];
        }
        return prevItems;
      });
    };

    // Este callback manejará las imágenes copiadas al portapapeles.
    const handleImageChange = (imageUrl) => {
      setItems((prevItems) => {
        // Verifica si la URL de la imagen ya está presente en el estado para evitar duplicados.
        if (!prevItems.find(item => item.type === 'image' && item.src === imageUrl)) {
          return [{ type: 'image', src: imageUrl }, ...prevItems];
        }
        return prevItems;
      });
    };

    // Suscribirse a los eventos de cambio de portapapeles para texto e imagen.
    window.electronAPI.receive('clipboard-change', handleTextChange);
    window.electronAPI.receive('clipboard-image', handleImageChange);

    // Limpiar los listeners cuando el componente se desmonte.
    return () => {
      window.electronAPI.receive('clipboard-change', () => {});
      window.electronAPI.receive('clipboard-image', () => {});
    };
  }, []);

  // Función para eliminar un elemento de la lista.
  const deleteItem = (event, index) => {
    event.stopPropagation(); // Detener la propagación para evitar que se active handleItemClick.
    setItems((prevItems) => {
      const newItems = prevItems.filter((_, idx) => idx !== index);
      return newItems;
    });
  };

  // Función para manejar el clic en el texto: copia el texto al portapapeles.
  const handleItemClick = (item) => {
    if (typeof item === 'string' || item.type === 'text') {
      window.electronAPI.send('copy-to-clipboard', item);
    }
  };

  // Función para manejar el clic en una imagen: copia la imagen al portapapeles.
  const handleImageClick = (event, imageDataUrl) => {
    event.stopPropagation();
    window.electronAPI.send('copy-image-to-clipboard', imageDataUrl);
  };

  // Función para limpiar todos los elementos de la lista.
  const clearAll = () => {
    setItems([]);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-blue-50 h-screen">
      <div className="w-full max-w-md">
        {/* Encabezado fijo en la parte superior */}
        <section className="flex items-center justify-between mt-4 mb-6 sticky top-0 bg-blue-50 z-10">
          <h1 className="text-sm text-blue-700 truncate w-3/4">Historial del Portapapeles</h1>
          <button
            className="text-blue-700 hover:bg-blue-500 hover:text-white p-2 rounded-full transition ease-in-out"
            onClick={clearAll}
          >
            <IoTrashOutline size={24} />
          </button>
        </section>
        {/* Contenedor desplazable para la lista */}
        <div className="space-y-2 p-2 overflow-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {items.map((item, index) => (
            <div
              key={index}
              onClick={() => handleItemClick(item)}
              className="group relative bg-white rounded-lg shadow p-3 flex items-center justify-between transition duration-150 ease-in-out hover:bg-blue-100 min-h-[4rem]"
            >
              {item.type === 'image' ? (
                <img
                  src={item.src}
                  alt={`Clipboard Image ${index}`}
                  onClick={(event) => handleImageClick(event, item.src)}
                  className="max-h-16 mr-2 cursor-pointer"
                />
              ) : (
                <span className="text-gray-700 text-sm break-all flex-grow pr-4">{item}</span>
              )}
              <button
                className="text-gray-500 hover:text-red-500"
                onClick={(event) => deleteItem(event, index)}
              >
                <IoClose size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
