import React, { useState, useEffect } from 'react';
import { ColumnMapping } from '../types';
import { ArrowRight, TableProperties } from 'lucide-react';

interface ColumnMapperProps {
  columns: string[];
  onConfirm: (mapping: ColumnMapping, threshold: number) => void;
}

const ColumnMapper: React.FC<ColumnMapperProps> = ({ columns, onConfirm }) => {
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    expiration: '',
    status: '',
    license: ''
  });
  const [threshold, setThreshold] = useState(30);

  // Filter columns to exclude empty or auto-generated headers (common in SheetJS as __EMPTY)
  const validColumns = columns.filter(c => 
    c && 
    c.trim() !== '' && 
    !c.toString().toUpperCase().startsWith('__EMPTY') &&
    c.toString().toUpperCase() !== 'EMPTY'
  );

  // Auto-guess columns
  useEffect(() => {
    const newMapping = { ...mapping };
    validColumns.forEach(col => {
      const lower = col.toLowerCase();
      if (!newMapping.name && (lower.includes('nombre') || lower.includes('piloto') || lower.includes('apellido'))) {
        newMapping.name = col;
      }
      if (!newMapping.expiration && (lower.includes('venc') || lower.includes('fecha') || lower.includes('cma'))) {
        newMapping.expiration = col;
      }
      if (!newMapping.status && (lower.includes('estado') || lower.includes('status') || lower.includes('condicion'))) {
        newMapping.status = col;
      }
      if (!newMapping.license && (lower.includes('licencia') || lower.includes('nro'))) {
        newMapping.license = col;
      }
    });
    setMapping(newMapping);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  const isValid = mapping.name && mapping.expiration;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <TableProperties size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Configuración de Columnas</h2>
          <p className="text-sm text-slate-500">Asocia las columnas de tu Excel para que podamos analizar los datos.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nombre del Piloto <span className="text-red-500">*</span></label>
            <select 
              value={mapping.name}
              onChange={(e) => setMapping(p => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Seleccionar columna...</option>
              {validColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Expiration Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">F. Vencimiento Psicofísico <span className="text-red-500">*</span></label>
            <select 
              value={mapping.expiration}
              onChange={(e) => setMapping(p => ({ ...p, expiration: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Seleccionar columna...</option>
              {validColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status Field (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Estado / Vigencia (Opcional)</label>
            <select 
              value={mapping.status}
              onChange={(e) => setMapping(p => ({ ...p, status: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Sin columna de estado (Usar fecha)</option>
              {validColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-xs text-slate-400">Si se selecciona, buscaremos "NO VIGENTE".</p>
          </div>

           {/* License Field (Optional) */}
           <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nº Licencia (Opcional)</label>
            <select 
              value={mapping.license}
              onChange={(e) => setMapping(p => ({ ...p, license: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Seleccionar columna...</option>
              {validColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="h-px bg-slate-100 my-4" />

        {/* Threshold Input */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Criterio de Alerta (Días)</label>
          <div className="flex items-center gap-4">
            <input 
              type="number"
              min="1"
              max="365"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
              className="w-24 rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-sm text-slate-500">
              Se marcará como <span className="font-semibold text-amber-600">Próximo a Vencer</span> si faltan menos de {threshold} días.
            </p>
          </div>
        </div>

        <button
          disabled={!isValid}
          onClick={() => onConfirm(mapping, threshold)}
          className={`
            w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-all
            ${isValid 
              ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/20' 
              : 'bg-slate-300 cursor-not-allowed'
            }
          `}
        >
          Analizar Datos
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ColumnMapper;