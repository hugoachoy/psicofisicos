import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, Sparkles, RefreshCw, Plane, ShieldCheck, Settings } from 'lucide-react';

import { AppState, Pilot, PilotRawData, PilotStatus, ColumnMapping } from './types';
import { parseDate, getDaysDiff, formatDate } from './utils/dateUtils';
import { generateAIReport } from './services/geminiService';

import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import PilotCard from './components/PilotCard';
import SettingsModal from './components/SettingsModal';

function App() {
  const [state, setState] = useState<AppState>({
    step: 'UPLOAD',
    rawData: [],
    columns: [],
    mapping: { name: '', expiration: '', status: '', license: '' },
    processedPilots: [],
    thresholdDays: 30
  });

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Settings & API Key State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Load API Key from local storage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('aerocontrol_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('aerocontrol_api_key', key);
  };

  const handleDataLoaded = (data: PilotRawData[], columns: string[]) => {
    setState(prev => ({ ...prev, rawData: data, columns, step: 'MAPPING' }));
  };

  const processPilots = (mapping: ColumnMapping, threshold: number) => {
    const processed = state.rawData.map((row, index) => {
      const name = String(row[mapping.name] || 'Desconocido');
      const expirationVal = row[mapping.expiration];
      const statusVal = mapping.status ? String(row[mapping.status] || '') : '';
      const licenseVal = mapping.license ? String(row[mapping.license] || '') : undefined;
      
      const expDate = parseDate(expirationVal as string | number | undefined);
      
      let status = PilotStatus.VALID;
      
      // Logic 1: Explicit "NO VIGENTE" text
      if (statusVal && statusVal.toUpperCase().includes('NO VIGENTE')) {
        status = PilotStatus.EXPIRED;
      } 
      // Logic 2: Date Calculation
      else if (expDate) {
        const daysDiff = getDaysDiff(expDate);
        if (daysDiff < 0) {
          status = PilotStatus.EXPIRED;
        } else if (daysDiff <= threshold) {
          status = PilotStatus.WARNING;
        }
      } 

      return {
        id: `pilot-${index}`,
        name,
        licenseNumber: licenseVal,
        expirationDate: expDate,
        expirationString: String(expirationVal || ''),
        status,
        originalData: row
      };
    });

    // Sort: Expired first, then Warning, then Valid
    processed.sort((a, b) => {
      const order = { [PilotStatus.EXPIRED]: 0, [PilotStatus.WARNING]: 1, [PilotStatus.VALID]: 2 };
      return order[a.status] - order[b.status];
    });

    setState(prev => ({
      ...prev,
      mapping,
      thresholdDays: threshold,
      processedPilots: processed,
      step: 'DASHBOARD'
    }));
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Reporte de Vencimientos Psicofísicos", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString('es-AR');
    doc.text(`Fecha de generación: ${dateStr}`, 14, 30);
    doc.text(`Criterio de alerta: ${state.thresholdDays} días`, 14, 36);

    // Filter relevant pilots for PDF (Warning & Expired)
    const reportPilots = state.processedPilots.filter(p => p.status !== PilotStatus.VALID);

    const tableData = reportPilots.map(p => [
      p.name,
      p.licenseNumber || '-',
      p.expirationDate ? formatDate(p.expirationDate) : p.expirationString,
      p.status === PilotStatus.EXPIRED ? "NO VIGENTE" : "PRÓXIMO A VENCER"
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Piloto', 'Licencia', 'Vencimiento', 'Estado']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      styles: { fontSize: 10 },
      // Highlight rows logic
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          if (data.cell.raw === 'NO VIGENTE') {
            data.cell.styles.textColor = [220, 38, 38]; // Red
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [217, 119, 6]; // Amber
          }
        }
      }
    });

    doc.save(`reporte-psicofisicos-${dateStr.replace(/\//g, '-')}.pdf`);
  };

  const handleAIAnalysis = async () => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsGeneratingAI(true);
    setAiReport(null);
    const report = await generateAIReport(state.processedPilots, state.thresholdDays, apiKey);
    setAiReport(report);
    setIsGeneratingAI(false);
  };

  const resetApp = () => {
    setState({
        step: 'UPLOAD',
        rawData: [],
        columns: [],
        mapping: { name: '', expiration: '', status: '', license: '' },
        processedPilots: [],
        thresholdDays: 30
    });
    setAiReport(null);
  }

  // Stats
  const stats = useMemo(() => {
    const expired = state.processedPilots.filter(p => p.status === PilotStatus.EXPIRED).length;
    const warning = state.processedPilots.filter(p => p.status === PilotStatus.WARNING).length;
    return { expired, warning, total: state.processedPilots.length };
  }, [state.processedPilots]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        apiKey={apiKey}
        onSave={handleSaveApiKey}
      />

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Plane className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">
                AeroControl
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {state.step === 'DASHBOARD' && (
                 <button onClick={resetApp} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                    <RefreshCw size={16} />
                    <span className="hidden sm:inline">Nueva Carga</span>
                 </button>
              )}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-full transition-colors ${!apiKey ? 'text-red-500 bg-red-50 hover:bg-red-100 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title={!apiKey ? "Configurar API Key requerida" : "Configuración"}
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
        
        {state.step === 'UPLOAD' && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-12">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Control de Vencimientos</h1>
              <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
                Gestione de forma eficiente el estado psicofísico de su tripulación. 
                Suba su nómina y detecte automáticamente licencias no vigentes.
              </p>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        )}

        {state.step === 'MAPPING' && (
          <div className="animate-fade-in">
             <ColumnMapper columns={state.columns} onConfirm={processPilots} />
          </div>
        )}

        {state.step === 'DASHBOARD' && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Analizados</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                  <ShieldCheck size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-red-600">No Vigentes</p>
                  <p className="text-3xl font-bold text-red-700">{stats.expired}</p>
                </div>
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-red-50 to-transparent"></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 flex items-center justify-between relative overflow-hidden">
                 <div className="relative z-10">
                  <p className="text-sm font-medium text-amber-600">Próximos a Vencer</p>
                  <p className="text-3xl font-bold text-amber-700">{stats.warning}</p>
                </div>
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-amber-50 to-transparent"></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 px-2 w-full sm:w-auto text-center sm:text-left">Listado de Novedades</h2>
              <div className="flex gap-3 w-full sm:w-auto justify-center">
                 <button 
                  onClick={handleAIAnalysis}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 flex-1 sm:flex-none"
                 >
                   <Sparkles size={16} />
                   {isGeneratingAI ? '...' : 'IA'}
                 </button>
                 <button 
                  onClick={handleGeneratePDF}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none"
                 >
                   <Download size={16} />
                   PDF
                 </button>
              </div>
            </div>
            
            {/* AI Report Section */}
            {aiReport && (
              <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden animate-fade-in">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center gap-2">
                   <Sparkles className="text-white" size={20} />
                   <h3 className="font-bold text-white">Asistente Inteligente</h3>
                </div>
                <div className="p-6 sm:p-8 prose prose-indigo max-w-none text-sm sm:text-base">
                  <div className="whitespace-pre-line text-slate-700 leading-relaxed">
                    {aiReport}
                  </div>
                </div>
              </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {state.processedPilots
                .filter(p => p.status !== PilotStatus.VALID) // Show only issues by default or sort
                .map(pilot => (
                  <PilotCard key={pilot.id} pilot={pilot} />
              ))}
              {/* If no issues */}
              {stats.expired === 0 && stats.warning === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Todo en orden</h3>
                  <p className="text-slate-500">No se encontraron pilotos con vencimientos próximos o licencias no vigentes.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="w-full text-center text-slate-400 text-sm py-6 border-t border-slate-100 mt-auto">
        © {new Date().getFullYear()} AeroControl
      </footer>
    </div>
  );
}

export default App;