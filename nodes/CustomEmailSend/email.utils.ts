import { IDataObject, NodeApiError } from 'n8n-workflow';
import { AttachmentInfo, EmailValidationOptions } from './email.types';

/**
 * Parsea y valida direcciones de email de una cadena separada por comas
 */
export const parseEmails = (input: string | undefined): string | undefined =>
	typeof input === 'string'
		? input
				.split(',')
				.map((e) => e.trim())
				.filter(Boolean)
				.join(', ')
		: undefined;

/**
 * Valida una sola dirección de email
 */
export const validateEmail = (
	email: string, 
	options: EmailValidationOptions = {}
): boolean => {
	const { maxLength = 254, required = false } = options;
	
	if (!email.trim()) {
		return !required;
	}
	
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= maxLength;
};

/**
 * Valida una lista de direcciones de email separadas por comas
 */
export const validateEmailList = (
	value: string, 
	options: EmailValidationOptions = {}
): boolean => {
	if (!value.trim()) return !options.required;
	
	const emails = value.split(',').map((email) => email.trim());
	return emails.every((email) => validateEmail(email, options));
};

/**
 * Construye el contenido del email basado en la selección de formato
 */
export const buildEmailContent = (
	emailFormat: string, 
	text: string, 
	html: string
): Partial<IDataObject> => {
	const content: Partial<IDataObject> = {};
	
	switch (emailFormat) {
		case 'text':
			content.text = text;
			break;
		case 'html':
			content.html = html;
			break;
		case 'both':
			content.text = text;
			content.html = html;
			break;
		default:
			content.html = html;
	}
	
	return content;
};

/**
 * Parsea headers personalizados desde una cadena JSON
 */
export const parseCustomHeaders = (
	customHeadersStr: string, 
	node: any
): Record<string, string> => {
	if (!customHeadersStr.trim()) return {};
	
	try {
		const headers = JSON.parse(customHeadersStr);
		
		if (typeof headers !== 'object' || headers === null || Array.isArray(headers)) {
			throw new Error('Headers must be a valid JSON object');
		}
		
		return headers;
	} catch (error) {
		throw new NodeApiError(node, {
			message: `Custom Headers must be valid JSON: ${error.message}`,
		});
	}
};

/**
 * Construye adjuntos desde nombres de propiedades separados por comas
 */
export const buildAttachments = async (
	adjuntosStr: string,
	helpers: any,
	itemIndex: number
): Promise<AttachmentInfo[]> => {
	const attachments: AttachmentInfo[] = [];
	const attachmentProperties: string[] = adjuntosStr
		.split(',')
		.map((propertyName) => propertyName.trim())
		.filter(Boolean);

	for (const propertyName of attachmentProperties) {
		try {
			const binaryData = helpers.assertBinaryData(itemIndex, propertyName);
			attachments.push({
				filename: binaryData.fileName || propertyName,
				content: await helpers.getBinaryDataBuffer(itemIndex, propertyName),
				cid: propertyName,
			});
		} catch (error) {
			console.warn(`Failed to process attachment '${propertyName}':`, error.message);
			// Continúa procesando otros adjuntos
		}
	}

	return attachments;
};

/**
 * Aplica configuración de modo de prueba a las opciones de correo
 */
export const applyTestMode = (
	mailOptions: IDataObject, 
	testMode: boolean, 
	testEmail: string, 
	testSubjectPrefix: string, 
	originalSubject: string
): void => {
	if (!testMode || !testEmail) return;
	
	// Almacena destinatarios originales para referencia
	const originalRecipients = {
		to: mailOptions.to,
		cc: mailOptions.cc,
		bcc: mailOptions.bcc,
		replyTo: mailOptions.replyTo,
	};
	
	mailOptions.to = testEmail;
	delete mailOptions.cc;
	delete mailOptions.bcc;
	delete mailOptions.replyTo;

	if (testSubjectPrefix.trim()) {
		mailOptions.subject = `${testSubjectPrefix.trim()} ${originalSubject}`;
	}
	
	mailOptions.originalRecipients = originalRecipients;
};

/**
 * Aplica opciones adicionales de email (prioridad, fechas, créditos, etc.)
 */
export const applyEmailOptions = (mailOptions: IDataObject, options: IDataObject): void => {
	if (options.priority) {
		mailOptions.priority = options.priority;
	}

	if (options.inReplyTo) {
		mailOptions.inReplyTo = options.inReplyTo;
	}
	
	if (options.references && typeof options.references === 'string') {
		mailOptions.references = options.references
			.split(',')
			.map((id: string) => id.trim())
			.filter(Boolean);
	}

	if (options.date) {
		try {
			mailOptions.date = new Date(options.date as string);
		} catch (error) {
			console.warn('Invalid date provided, using current date');
		}
	}

	if (
		typeof options.calendarEvent === 'string' &&
		options.calendarEvent.trim() &&
		options.calendarEvent.includes('BEGIN:VCALENDAR')
	) {
		mailOptions.icalEvent = {
			filename: 'event.ics',
			method: 'REQUEST',
			content: options.calendarEvent as string,
		};
	}

	if (options.appendCredits) {
		const creditText = '\\n\\n---\\nDesarrollado por Cristianemek';
		const creditHtml = '<br><br>---<br>Desarrollado por Cristianemek';
		
		if (mailOptions.text) {
			mailOptions.text += creditText;
		}
		if (mailOptions.html) {
			mailOptions.html += creditHtml;
		}
	}

	if (typeof options.ccEmail === 'string' && options.ccEmail.trim()) {
		mailOptions.cc = parseEmails(options.ccEmail);
	}
	if (typeof options.bccEmail === 'string' && options.bccEmail.trim()) {
		mailOptions.bcc = parseEmails(options.bccEmail);
	}
	if (typeof options.replyTo === 'string' && options.replyTo.trim()) {
		mailOptions.replyTo = parseEmails(options.replyTo);
	}
};

/**
 * Procesa el envío de email para un único item
 */
export const processEmailItem = async (
	executeFunctions: any,
	transporter: any,
	itemIndex: number
): Promise<any> => {
	const from = executeFunctions.getNodeParameter('fromEmail', itemIndex) as string;
	const to = executeFunctions.getNodeParameter('toEmail', itemIndex) as string;
	const subject = executeFunctions.getNodeParameter('subject', itemIndex) as string;
	const emailFormat = executeFunctions.getNodeParameter('emailFormat', itemIndex) as string;
	const text = executeFunctions.getNodeParameter('text', itemIndex, '') as string;
	const html = executeFunctions.getNodeParameter('html', itemIndex, '') as string;

	const testMode = executeFunctions.getNodeParameter('testMode', itemIndex, false) as boolean;
	const testEmail = executeFunctions.getNodeParameter('testEmail', itemIndex, '') as string;
	const testSubjectPrefix = executeFunctions.getNodeParameter('testSubjectPrefix', itemIndex, '[TEST]') as string;

	const customHeadersStr = executeFunctions.getNodeParameter('customHeaders', itemIndex, '') as string;
	const enableCustomHeaders = executeFunctions.getNodeParameter('enableCustomHeaders', itemIndex, false) as boolean;
	const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;

	const mailOptions: IDataObject = {
		from,
		to: parseEmails(to),
		subject,
		...buildEmailContent(emailFormat, text, html),
	};

	if (enableCustomHeaders) {
		const headers = parseCustomHeaders(customHeadersStr, executeFunctions.getNode());
		if (Object.keys(headers).length > 0) {
			mailOptions.headers = Object.fromEntries(
				Object.entries(headers).map(([key, value]) => [key, String(value)]),
			);
		}
	}

	const items = executeFunctions.getInputData();
	if (options.adjuntos && items[itemIndex].binary) {
		const attachments = await buildAttachments(
			options.adjuntos as string,
			executeFunctions.helpers,
			itemIndex
		);
		if (attachments.length) {
			mailOptions.attachments = attachments;
		}
	}

	applyEmailOptions(mailOptions, options);

	applyTestMode(mailOptions, testMode, testEmail, testSubjectPrefix, subject);

	const info = await transporter.sendMail(mailOptions);

	return { info, testMode, options, to };
};
