// Excel base date logic
export const excelDateToJSDate = (serial: number): Date => {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
};

export const parseDate = (value: string | number | undefined): Date | null => {
  if (value === undefined || value === null || value === '') return null;

  // Case 1: Excel Serial Number
  if (typeof value === 'number') {
    return excelDateToJSDate(value);
  }

  // Case 2: String Date (Various formats)
  if (typeof value === 'string') {
    // Try standard JS date parser first
    let d = new Date(value);
    if (!isNaN(d.getTime())) return d;

    // Try DD/MM/YYYY or DD-MM-YYYY (Common in Latam)
    const parts = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (parts) {
      // Assuming DD/MM/YYYY
      d = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
};

export const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const getDaysDiff = (target: Date): number => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const targetDate = new Date(target);
  targetDate.setHours(0,0,0,0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};
