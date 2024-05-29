import React, { useState, useEffect } from 'react';
import { IoTrashOutline, IoClose } from 'react-icons/io5';

export default function ClipboardHistory() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Escuchar cambios de texto en el portapapeles
    window.electronAPI.receive('clipboard-change', (text) => {
      setItems(prevItems => [{ type: 'text', content: text }, ...prevItems]);
    });

    // Escuchar cambios de imagen en el portapapeles
    window.electronAPI.receive('clipboard-image', (imageUrl) => {
      setItems(prevItems => [{ type: 'image', src: imageUrl }, ...prevItems]);
    });

    // Opcional: Escuchar cambios de ficheros en el portapapeles
    window.electronAPI.receive('clipboard-file', (filePath) => {
      setItems(prevItems => [{ type: 'file', path: filePath }, ...prevItems]);
    });

    return () => {
      window.electronAPI.receive('clipboard-change', () => {});
      window.electronAPI.receive('clipboard-image', () => {});
      window.electronAPI.receive('clipboard-file', () => {});
    };
  }, []);

  const deleteItem = (index) => {
    setItems(prevItems => prevItems.filter((_, idx) => idx !== index));
  };

  const handleItemClick = (item) => {
    if (item.type === 'text') {
      window.electronAPI.send('copy-to-clipboard', item.content);
    } else if (item.type === 'image') {
      window.electronAPI.send('copy-image-to-clipboard', item.src);
    } else if (item.type === 'file') {
      // Handle file copying if necessary
      console.log('File path:', item.path);
    }
  };

  const clearAll = () => {
    setItems([]);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-blue-50 h-screen">
      <div className="w-full max-w-md">
        <section className="flex items-center justify-between mt-4 mb-6 sticky top-0 bg-blue-50 z-10">
          <h1 className="text-sm text-blue-700 truncate w-3/4">Clipboard History</h1>
          <button className="text-blue-700 hover:bg-blue-500 hover:text-white p-2 rounded-full transition ease-in-out" onClick={clearAll}>
            <IoTrashOutline size={24} />
          </button>
        </section>
        <div className="space-y-2 p-2 overflow-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {items.map((item, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-lg shadow p-3 flex items-center justify-between transition duration-150 ease-in-out hover:bg-blue-100 cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              {item.type === 'text' && (
                <span className="text-gray-700 text-sm break-all flex-grow pr-4">
                  {item.content}
                </span>
              )}
              {item.type === 'image' && (
                <img
                  src={item.src}
                  alt={`Clipboard Image`}
                  className="max-h-16 mr-2 cursor-pointer"
                />
              )}
              {item.type === 'file' && (
                <span className="text-gray-700 text-sm break-all flex-grow pr-4">
                  File: {item.path}
                </span>
              )}
              <button
                className="absolute right-2 top-2 text-gray-500 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem(index);
                }}
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
