import React, { useState, useEffect } from 'react';
import { X, Key, Save, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKey, onSave }) => {
  const [inputKey, setInputKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputKey(apiKey);
    }
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(inputKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <Key size={20} className="text-indigo-600" />
            <h3 className="font-semibold text-lg">Configuración</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Pegue su API Key aquí..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              Esta clave se guarda localmente en su navegador.
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 text-xs text-indigo-800 flex flex-col gap-2">
            <p>
              Para utilizar la generación de reportes con Inteligencia Artificial, necesita una API Key gratuita de Google.
            </p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold hover:underline"
            >
              Obtener API Key <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Save size={16} />
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
