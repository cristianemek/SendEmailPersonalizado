# Nodo CustomEmailSend - Estructura del Código

Este directorio contiene el nodo CustomEmailSend con código limpio y funcional para envío de emails en n8n.

## Estructura de Archivos

Solo 3 archivos principales mantienen el nodo simple pero funcional:

#### `CustomEmailSend.node.ts`
- **Implementación principal del nodo**
- Interfaz INodeType para n8n
- Configuración de propiedades y UI del nodo
- Método execute que usa las funciones de utilidad

#### `email.types.ts`
- **Constantes y tipos TypeScript**
- `EMAIL_FORMATS`: text, html, both
- `PRIORITIES`: normal, high, low
- `DEFAULT_HEADERS`: Headers de compliance básicos
- Interfaces para validación y adjuntos

#### `email.utils.ts`
- **9 funciones de utilidad puras**
- Todas las funciones están bien documentadas
- Sin dependencias externas complejas
- Fácil de mantener y probar

## Funciones Implementadas

### 1. **Manejo de Emails**
```typescript
// Parsea lista de emails separados por comas
parseEmails('user1@domain.com, user2@domain.com')

// Valida un email individual
validateEmail('user@domain.com', { maxLength: 254, required: true })

// Valida lista de emails
validateEmailList('user1@domain.com, user2@domain.com')
```

### 2. **Construcción de Contenido**
```typescript
// Construye contenido según formato
buildEmailContent('html', textContent, htmlContent)
// Retorna: { text }, { html }, o { text, html }
```

### 3. **Headers Personalizados**
```typescript
// Parsea JSON de headers personalizados
parseCustomHeaders('{"Custom-Header": "value"}', node)
```

### 4. **Adjuntos**
```typescript
// Procesa adjuntos desde propiedades binarias
buildAttachments('archivo1,archivo2', helpers, itemIndex)
```

### 5. **Modo de Prueba**
```typescript
// Redirige emails a dirección de prueba
applyTestMode(mailOptions, true, 'test@example.com', '[PRUEBA]', subject)
```

### 6. **Opciones Adicionales**
```typescript
// Aplica prioridad, CC, BCC, créditos, etc.
applyEmailOptions(mailOptions, { 
  priority: 'high', 
  ccEmail: 'cc@domain.com',
  appendCredits: true 
})
```

### 7. **Procesamiento Principal**
```typescript
// Función principal que procesa un email
processEmailItem(executeFunctions, transporter, itemIndex)
```

## Características del Código

### ✅ **Lo que SÍ tiene:**
- **Funciones puras** - Sin efectos secundarios
- **Código limpio** - Funciones pequeñas y enfocadas  
- **Validación robusta** - Manejo de errores apropiado
- **Separación de responsabilidades** - UI separada de lógica
- **TypeScript** - Tipado fuerte para seguridad
- **Documentación** - Comentarios claros en español
- **Simplicidad** - Solo lo necesario, nada más

### ❌ **Lo que NO tiene (por diseño):**
- Sistemas de logging complejos
- Plantillas de email avanzadas
- Validación DNS/MX
- Procesamiento en lotes
- Cache o persistencia
- Métricas avanzadas

## Ejemplos de Uso Real

### Envío Básico
```typescript
const result = await processEmailItem(executeFunctions, transporter, itemIndex);
```

### Con Validación
```typescript
if (validateEmail(emailAddress)) {
  // Procesar email válido
}
```

### Modo Desarrollo
```typescript
// Redirigir todos los emails a tu cuenta de prueba
applyTestMode(mailOptions, true, 'mi-email@test.com', '[DEV]', subject);
```

### Con Headers Personalizados
```typescript
const headers = parseCustomHeaders('{"X-Campaign": "newsletter"}', node);
```


## Cómo Extender

Si necesitas agregar funcionalidad:

1. **Nueva función de utilidad** → Agregar a `email.utils.ts`
2. **Nueva constante** → Agregar a `email.types.ts`  
3. **Nueva propiedad UI** → Modificar `CustomEmailSend.node.ts`

