# n8n-nodes-custom-email-send

Este paquete incluye un nodo personalizado para [n8n](https://n8n.io) que permite **enviar correos usando credenciales SMTP** ya configuradas en n8n, con soporte para **cabeceras personalizadas** como `List-Unsubscribe`.

---

## ✨ Características

- Envío de correos por SMTP
- Uso de credenciales SMTP existentes de n8n
- Soporte para cabeceras personalizadas en formato JSON
- Basado en nodemailer

---

## 🧪 Ejemplo de uso

1. Añade el nodo **Send Email Custom** a tu flujo
2. Configura:
   - Dirección de destino (`to`)
   - Asunto (`subject`)
   - Mensaje (`message`)
   - Cabeceras opcionales en JSON:
     ```json
     {
       "List-Unsubscribe": "<mailto:unsubscribe@discoazul.com>"
     }
     ```

---

## 🔧 Instalación

```bash
npm install n8n-nodes-custom-email-send
