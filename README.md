# n8n-nodes-custom-email-send

Este paquete incluye un nodo personalizado para [n8n](https://n8n.io) que permite **enviar correos electrónicos avanzados usando credenciales SMTP** ya configuradas en n8n, con soporte para **cabeceras personalizadas** y funcionalidades orientadas principalmente a la gestión de listas de correo y cumplimiento de buenas prácticas de email marketing.

---

## 🎯 Propósito principal

Este nodo fue creado principalmente para facilitar el uso de la cabecera **List-Unsubscribe** en tus envíos, permitiendo agregarla fácilmente mediante un botón (toggle) en la configuración del nodo. Así, puedes cumplir con los requisitos de plataformas como Gmail y Outlook para la gestión de bajas automáticas en listas de correo.

---

## ✨ Funcionalidades

- Envío de correos por SMTP usando credenciales de n8n
- Soporte para **cabeceras personalizadas** en formato JSON (ejemplo: `List-Unsubscribe`)
- **Botón para agregar automáticamente las cabeceras List-Unsubscribe y List-Unsubscribe-Post** si el campo de cabeceras está vacío
- Soporte para:
  - Texto y/o HTML en el cuerpo del correo
  - Adjuntos (archivos y eventos de calendario `.ics`)
  - CC y BCC (copias y copias ocultas)
  - Reply-To personalizado
  - Fecha personalizada de envío
  - Ignorar problemas SSL (para servidores con certificados autofirmados)
  - Prioridad del correo (alta, normal, baja)
  - In-Reply-To y References (para hilos de correo)
  - Opción para incluir créditos del autor al final del mensaje (opcional)
- Basado en **nodemailer**

---

## 🧪 Ejemplo de uso

1. Añade el nodo **Enviar Email Personalizado** a tu flujo en n8n.
2. Configura los campos principales:
   - Dirección de destino (`toEmail`)
   - Asunto (`subject`)
   - Formato de correo (`emailFormat`: texto, HTML o ambos)
   - Mensaje (`text` y/o `html`)
3. Opcionalmente, configura:
   - **Cabeceras personalizadas** en formato JSON:
     ```json
     {
       "List-Unsubscribe": "<mailto:unsubscribe@tudominio.com>",
       "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
     }
     ```
   - Activa el **botón "Agregar encabezados List-Unsubscribe"** para que se añadan automáticamente si el campo anterior está vacío.
   - Adjuntos: rutas de archivos separados por coma o contenido de evento de calendario (ICS).
   - CC/BCC: correos separados por coma.
   - Reply-To: dirección de respuesta.
   - Fecha personalizada.
   - Prioridad del correo.
   - In-Reply-To y References.
   - Opción para incluir créditos del autor.

---

## ⚙️ Opciones disponibles

- **Agregar encabezados List-Unsubscribe**: Toggle para añadir automáticamente las cabeceras recomendadas si el campo de cabeceras personalizadas está vacío.
- **Encabezados personalizados (JSON)**: Permite definir cualquier cabecera extra.
- **Adjuntos**: Rutas de archivos o binarios de n8n.
- **Evento de calendario (ICS)**: Pega el contenido de un archivo `.ics` para enviar invitaciones de calendario.
- **Correo CC/BCC**: Para enviar copias y copias ocultas.
- **Reply-To Email**: Dirección de respuesta.
- **Fecha personalizada**: Fecha de envío.
- **Ignorar problemas SSL**: Permite conexiones inseguras (solo si confías en el servidor).
- **Prioridad**: Alta, normal o baja.
- **In-Reply-To**: Message-ID al que responde este correo.
- **References**: IDs de mensajes previos para hilos.
- **Incluir créditos del autor**: Añade una línea de crédito al final del mensaje (opcional).

---

## 🚀 Cómo agregar este nodo a tus flujos de n8n (Community Nodes)

1. **Instala el paquete en tu instancia de n8n:**

   Ve a **Settings > Community Nodes** en tu instancia de n8n y haz clic en **Install Community Node**.  
   Busca o pega el nombre del paquete:

   ```
   n8n-nodes-custom-email-send
   ```

   O instala desde terminal en la carpeta de tu n8n:

   ```bash
   npm install n8n-nodes-custom-email-send
   ```

  Marca la casilla **"I understand the risks"** para continuar con la instalación.

2. **Reinicia n8n** si es necesario para que el nodo aparezca en el editor.

---

> **Nota:**  
> Si no ves el nodo tras instalarlo, asegúrate de estar usando una versión de n8n compatible con Community Nodes y de haber reiniciado

## 📝 Notas

- Si usas el botón para Activar encabezados personalizados, se añadirán automáticamente las cabeceras `List-Unsubscribe` y `List-Unsubscribe-Post` recomendadas para facilitar la baja automática en clientes de correo como Gmail y Outlook,si no defines otras.
- Puedes ingresar múltiples correos en los campos `to`, `cc` y `bcc` separados por coma.
- Para adjuntos binarios, usa los helpers de n8n o rutas absolutas.

---

## 👨‍💻 Autor

**Desarrollado por Cristianemek**  
[GitHub](https://github.com/cristianemek)