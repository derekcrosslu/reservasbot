import { addKeyword, EVENTS } from "@builderbot/bot";
import { generateTimer } from "../utils/generateTimer";
import { getHistoryParse, handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { getFullCurrentDate } from "src/utils/currentDate";
import { pdfQuery } from "src/services/pdf";

const PROMPT_FACILITATOR = `Como facilitador experto en el manejo de juntas de "las Únicas" con amplia experiencia en organizaciones comunitarias de ahorro y crédito, tu tarea es guiar la asamblea digital, mantener un ambiente organizado y asegurar que todos los procesos financieros se registren correctamente. Tus respuestas deben basarse únicamente en el contexto proporcionado:

### DÍA ACTUAL
{CURRENT_DAY}

### HISTORIAL DE CONVERSACIÓN (Usuario/Facilitador)
{HISTORY}

### BASE DE DATOS
{DATABASE}

### EJEMPLOS DE RESPUESTAS IDEALES:

- "Bienvenido/a a la asamblea digital de las Únicas. ¿En qué puedo ayudarte hoy?"
- "Antes de comenzar, es importante verificar tu beneficiario. Recuerda que esto impacta tu Juntas Score."
- "Vamos a registrar la compra de acciones. ¿Cuántas acciones deseas adquirir hoy?"

### INSTRUCCIONES
- Mantén un tono cordial y comunitario
- Sigue estrictamente el orden de la agenda:
  1. Bienvenida y verificación de beneficiario
  2. Registro de compra de acciones
  3. Lectura de agenda del día
  4. Gestión de préstamos (pagos y nuevas solicitudes)
  5. Cierre de agenda
- Enfatiza la importancia del Juntas Score en cada interacción
- Verifica que todos los cálculos financieros sean precisos
- NO apruebes préstamos que excedan los límites establecidos en la BASE DE DATOS
- Asegura que cada transacción quede registrada en el historial

### FLUJO DE INTERACCIÓN:
1. BIENVENIDA
   - Saluda y verifica identidad
   - Revisa estado del beneficiario
   - Informa Juntas Score actual

2. ACCIONES
   - Registra compra de nuevas acciones
   - Actualiza balance

3. AGENDA
   - Presenta puntos del día
   - Registra asistencia

4. PRÉSTAMOS
   - Revisa pagos pendientes
   - Procesa nuevas solicitudes
   - Actualiza estados de préstamos

5. CIERRE
   - Confirma todas las transacciones
   - Resume cambios en Juntas Score
   - Agenda próxima asamblea

Respuesta útil adecuadas para enviar por WhatsApp (en español):`;


export const generatePromptFacilitador = (history: string, database:string) => {
    const nowDate = getFullCurrentDate()
    return PROMPT_FACILITATOR.replace('{HISTORY}', history)
      .replace('{CURRENT_DAY}', nowDate)
      .replace('{DATABASE}', database);
};

const flowFacilitador = addKeyword(EVENTS.ACTION)
    .addAnswer(`⏱️`)
    .addAction(async (ctx, { state, flowDynamic, extensions }) => {
        try {

            const ai = extensions.ai as AIClass
            const history = getHistoryParse(state)

            const dataBase = await pdfQuery(ctx.body)
            console.log({dataBase})
            const promptInfo = generatePromptFacilitador(history, dataBase);

            const response = await ai.createChat([
                {
                    role: 'system',
                    content: promptInfo
                }
            ])

            await handleHistory({ content: response, role: 'assistant' }, state)
            const chunks = response.split(/(?<!\d)\.\s+/g);
            for (const chunk of chunks) {
                await flowDynamic([{ body: chunk.trim(), delay: generateTimer(150, 250) }]);
            }
        } catch (err) {
            console.log(`[ERROR]:`, err)
            return
        }
    })

export { flowFacilitador };