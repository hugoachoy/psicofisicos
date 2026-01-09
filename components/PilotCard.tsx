import React from 'react';
import { Pilot, PilotStatus } from '../types';
import { formatDate } from '../utils/dateUtils';
import { AlertCircle, User, Calendar, CheckCircle } from 'lucide-react';

interface PilotCardProps {
  pilot: Pilot;
}

const PilotCard: React.FC<PilotCardProps> = ({ pilot }) => {
  const isExpired = pilot.status === PilotStatus.EXPIRED;
  const isWarning = pilot.status === PilotStatus.WARNING;

  return (
    <div className={`
      relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all hover:shadow-md bg-white
      ${isExpired ? 'border-red-200 bg-red-50/30' : ''}
      ${isWarning ? 'border-amber-200 bg-amber-50/30' : ''}
      ${!isExpired && !isWarning ? 'border-slate-200' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            flex h-10 w-10 items-center justify-center rounded-full
            ${isExpired ? 'bg-red-100 text-red-600' : ''}
            ${isWarning ? 'bg-amber-100 text-amber-600' : ''}
            ${!isExpired && !isWarning ? 'bg-emerald-100 text-emerald-600' : ''}
          `}>
            {isExpired ? <AlertCircle size={20} /> : isWarning ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{pilot.name}</h3>
            {pilot.licenseNumber && (
              <p className="text-xs text-slate-500">Lic: {pilot.licenseNumber}</p>
            )}
          </div>
        </div>
        <div className={`
          rounded-full px-2 py-1 text-xs font-medium
          ${isExpired ? 'bg-red-100 text-red-700' : ''}
          ${isWarning ? 'bg-amber-100 text-amber-700' : ''}
          ${!isExpired && !isWarning ? 'bg-emerald-100 text-emerald-700' : ''}
        `}>
          {isExpired ? 'NO VIGENTE' : isWarning ? 'PRÓXIMO A VENCER' : 'VIGENTE'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">Vencimiento</span>
          <div className="flex items-center gap-1 font-medium text-slate-700">
            <Calendar size={14} />
            {pilot.expirationDate ? formatDate(pilot.expirationDate) : pilot.expirationString}
          </div>
        </div>
        {/* If we had more fields we could put them here */}
      </div>
      
      {/* Decorative bar */}
      <div className={`
        absolute bottom-0 left-0 h-1 w-full
        ${isExpired ? 'bg-red-500' : ''}
        ${isWarning ? 'bg-amber-500' : ''}
        ${!isExpired && !isWarning ? 'bg-emerald-500' : ''}
      `} />
    </div>
  );
};

export default PilotCard;
