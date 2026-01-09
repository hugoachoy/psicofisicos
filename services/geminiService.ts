import { GoogleGenAI } from "@google/genai";
import { Pilot, PilotStatus } from "../types";

export const generateAIReport = async (pilots: Pilot[], thresholdDays: number, apiKey: string): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key no configurada. Por favor, ingrese su clave de API en el menú de configuración.";
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Filter only relevant pilots to save tokens and focus context
  const criticalPilots = pilots.filter(p => p.status !== PilotStatus.VALID);
  
  if (criticalPilots.length === 0) {
    return "No hay novedades ni vencimientos próximos para reportar. Toda la tripulación se encuentra operativa.";
  }
  
  const summaryData = criticalPilots.map(p => ({
    name: p.name,
    expiration: p.expirationString,
    status: p.status === PilotStatus.EXPIRED ? "VENCIDO/NO VIGENTE" : "PRÓXIMO A VENCER"
  }));

  const prompt = `
    Actúa como un Jefe de Operaciones Aéreas experto. Analiza la siguiente lista de pilotos con problemas en su vencimiento psicofísico.
    El criterio de alerta temprana es de ${thresholdDays} días.

    Datos de pilotos (JSON):
    ${JSON.stringify(summaryData)}

    Por favor genera un "Resumen Ejecutivo de Novedades" breve y profesional.
    1. Un párrafo resumiendo la gravedad de la situación (total vencidos vs próximos).
    2. Una lista de acciones recomendadas inmediatas (ej: contactar, suspender programación de vuelo).
    3. Un borrador de correo electrónico genérico, formal pero firme, que se pueda enviar a los pilotos afectados recordándoles la renovación urgente.
    
    Formato: Markdown. Mantén el tono serio y aeronáutico.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No se pudo generar el reporte.";
  } catch (error) {
    console.error("Error generating AI report:", error);
    return "Hubo un error al conectar con el servicio de IA. Verifique que su API Key sea válida y tenga permisos.";
  }
};
