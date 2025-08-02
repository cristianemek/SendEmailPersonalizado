import { IDataObject, NodeApiError } from 'n8n-workflow';
import { AttachmentInfo, EmailValidationOptions } from './email.types';

/**
 * Parse and validate email addresses from a comma-separated string
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
 * Validate a single email address
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
 * Validate a comma-separated list of email addresses
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
 * Build email content based on format selection
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
			content.html = html; // fallback to HTML
	}
	
	return content;
};

/**
 * Parse custom headers from JSON string
 */
export const parseCustomHeaders = (
	customHeadersStr: string, 
	node: any
): Record<string, string> => {
	if (!customHeadersStr.trim()) return {};
	
	try {
		const headers = JSON.parse(customHeadersStr);
		
		// Validate that headers is an object
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
 * Build attachments from comma-separated property names
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
			// Continue processing other attachments
		}
	}

	return attachments;
};

/**
 * Apply test mode settings to mail options
 */
export const applyTestMode = (
	mailOptions: IDataObject, 
	testMode: boolean, 
	testEmail: string, 
	testSubjectPrefix: string, 
	originalSubject: string
): void => {
	if (!testMode || !testEmail) return;
	
	// Store original recipients for reference
	const originalRecipients = {
		to: mailOptions.to,
		cc: mailOptions.cc,
		bcc: mailOptions.bcc,
		replyTo: mailOptions.replyTo,
	};
	
	// Override recipients
	mailOptions.to = testEmail;
	delete mailOptions.cc;
	delete mailOptions.bcc;
	delete mailOptions.replyTo;

	// Add test prefix to subject if provided
	if (testSubjectPrefix.trim()) {
		mailOptions.subject = `${testSubjectPrefix.trim()} ${originalSubject}`;
	}
	
	// Store original recipients in a custom header for reference
	mailOptions.originalRecipients = originalRecipients;
};

/**
 * Apply additional email options (priority, dates, credits, etc.)
 */
export const applyEmailOptions = (mailOptions: IDataObject, options: IDataObject): void => {
	// Priority
	if (options.priority) {
		mailOptions.priority = options.priority;
	}

	// Reply references
	if (options.inReplyTo) {
		mailOptions.inReplyTo = options.inReplyTo;
	}
	
	if (options.references && typeof options.references === 'string') {
		mailOptions.references = options.references
			.split(',')
			.map((id: string) => id.trim())
			.filter(Boolean);
	}

	// Date
	if (options.date) {
		try {
			mailOptions.date = new Date(options.date as string);
		} catch (error) {
			console.warn('Invalid date provided, using current date');
		}
	}

	// Calendar event
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

	// Credits
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

	// Email addresses
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
 * Process email sending for a single item
 */
export const processEmailItem = async (
	executeFunctions: any,
	transporter: any,
	itemIndex: number
): Promise<any> => {
	// Extract parameters
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

	// Build mail options
	const mailOptions: IDataObject = {
		from,
		to: parseEmails(to),
		subject,
		...buildEmailContent(emailFormat, text, html),
	};

	// Apply custom headers
	if (enableCustomHeaders) {
		const headers = parseCustomHeaders(customHeadersStr, executeFunctions.getNode());
		if (Object.keys(headers).length > 0) {
			mailOptions.headers = Object.fromEntries(
				Object.entries(headers).map(([key, value]) => [key, String(value)]),
			);
		}
	}

	// Handle attachments
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

	// Apply additional options
	applyEmailOptions(mailOptions, options);

	// Apply test mode
	applyTestMode(mailOptions, testMode, testEmail, testSubjectPrefix, subject);

	// Send email
	const info = await transporter.sendMail(mailOptions);

	return { info, testMode, options, to };
};
