import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PilotRawData } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: PilotRawData[], columns: string[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Parse to JSON with header row 
      const jsonData = XLSX.utils.sheet_to_json<PilotRawData>(worksheet, { defval: "" });
      
      if (jsonData.length > 0) {
        const columns = Object.keys(jsonData[0]);
        onDataLoaded(jsonData, columns);
      } else {
        alert("El archivo parece estar vacío.");
      }
    } catch (error) {
      console.error("Error parsing Excel:", error);
      alert("Error al leer el archivo Excel. Asegúrese de que sea un formato válido.");
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-0">
      <div
        className={`
          relative flex flex-col items-center justify-center p-8 sm:p-12 text-center 
          rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer active:scale-95
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.02]' 
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        
        <div className={`
          p-4 rounded-full bg-indigo-50 text-indigo-600 mb-4 transition-transform
          ${isDragging ? 'scale-110' : ''}
        `}>
          {loading ? (
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          ) : (
            <UploadCloud size={40} />
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          {loading ? 'Procesando...' : 'Cargar nómina'}
        </h3>
        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
          <span className="hidden sm:inline">Arrastra tu archivo Excel o haz clic para buscarlo.</span>
          <span className="sm:hidden">Toca aquí para seleccionar tu archivo Excel (.xlsx).</span>
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileSpreadsheet size={14} />
          <span>Compatible con móviles</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;