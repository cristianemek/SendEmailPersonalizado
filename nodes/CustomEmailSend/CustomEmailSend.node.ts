import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	NodeConnectionType,
	NodeApiError,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';

import nodemailer from 'nodemailer';

export class CustomEmailSend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Enviar Email Personalizado',
		name: 'customEmailSend',
		icon: 'fa:envelope',
		group: ['output'],
		version: 1,
		description: `Enviar correos electrónicos con encabezados personalizados a través de SMTP.`,
		defaults: {
			name: 'Enviar email',
			color: '#EA4B71',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [
			{
				name: 'smtp',
				required: true,
				testedBy: 'smtpConnectionTest',
			},
		],
		properties: [
			{
				displayName: 'From Email',
				name: 'fromEmail',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'from@example.com',
				description: 'Dirección de correo electrónico del remitente',
			},
			{
				displayName: 'To Email',
				name: 'toEmail',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'to@example.com, to2@example.com',
				description:
					'Dirección de correo electrónico del destinatario, separada por comas si es necesario enviar a varios destinatarios',
				typeOptions: {
					validation: {
						validate: (value: string) => {
							if (!value.trim()) return false;
							const emails = value.split(',').map((email) => email.trim());
							const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
							return emails.every((email) => emailRegex.test(email) && email.length <= 254);
						},
					},
				},
			},
			{
				displayName: 'Asunto',
				name: 'subject',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Formato De Correo',
				name: 'emailFormat',
				type: 'options',
				options: [
					{
						name: 'Texto',
						value: 'text',
						description: 'Enviar solo texto plano',
					},
					{
						name: 'HTML',
						value: 'html',
						description: 'Enviar solo HTML',
					},
					{
						name: 'Ambos',
						value: 'both',
						description: 'Enviar ambos formatos',
					},
				],
				default: 'html',
			},
			{
				displayName: 'Mensaje (Texto)',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				displayOptions: {
					show: {
						emailFormat: ['text', 'both'],
					},
				},
			},
			{
				displayName: 'Mensaje (HTML)',
				name: 'html',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				displayOptions: {
					show: {
						emailFormat: ['html', 'both'],
					},
				},
			},
			{
				displayName: 'Activar Encabezados Personalizados',
				name: 'enableCustomHeaders',
				type: 'boolean',
				default: false,
				description: 'Whether to show the field to define custom headers in JSON format',
			},
			{
				displayName: 'Encabezados Personalizados (JSON)',
				name: 'customHeaders',
				type: 'json',
				typeOptions: {
					rows: 5,
				},
				default: `{
  "List-Unsubscribe": "<mailto:unsubscribe@example.com>",
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
}`,
				placeholder: `{
  "List-Unsubscribe": "<mailto:unsubscribe@example.com>",
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
}`,
				description:
					'Encabezados personalizados en formato JSON. Por ejemplo: {"List-Unsubscribe": "&lt;mailto:unsubscribe@example.com&gt;"}. Puedes editar o borrar estos encabezados si lo deseas.',
				displayOptions: {
					show: {
						enableCustomHeaders: [true],
					},
				},
			},
			{
				displayName: 'Modo de prueba',
				name: 'testMode',
				type: 'boolean',
				default: false,
				description: 'Whether to send test emails to a specific address instead of real recipients',
			},
			{
				displayName: 'Email de prueba',
				name: 'testEmail',
				type: 'string',
				default: '',
				placeholder: 'test@example.com',
				description: 'Email donde se enviarán las pruebas (reemplaza a To, CC y BCC)',
				displayOptions: {
					show: {
						testMode: [true],
					},
				},
				typeOptions: {
					validation: {
						validate: (value: string) => {
							if (!value.trim()) return false;
							const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
							return emailRegex.test(value.trim());
						},
					},
				},
			},
			{
				displayName: 'Opciones',
				name: 'options',
				type: 'collection',
				placeholder: 'Agregar opción',
				default: {},
				options: [
					{
						displayName: 'Adjuntos',
						name: 'adjuntos',
						type: 'string',
						default: '',
						description:
							'Ruta de los archivos adjuntos separados por comas. Por ejemplo: /ruta/a/archivo1,/ruta/a/archivo2.',
					},
					{
						displayName: 'Correo BCC',
						name: 'bccEmail',
						type: 'string',
						default: '',
						placeholder: 'bcc@ejemplo.com, bcc2@ejemplo.com',
						description:
							'Dirección de correo electrónico del destinatario en copia oculta (BCC) (separada por comas si es necesario enviar a varios destinatarios)',
					},
					{
						displayName: 'Correo CC',
						name: 'ccEmail',
						type: 'string',
						default: '',
						placeholder: 'cc@ejemplo.com, cc2@ejemplo.com',
						description:
							'Dirección de correo electrónico del destinatario en copia (CC) (separada por comas si es necesario enviar a varios destinatarios)',
					},
					{
						displayName: 'Evento De Calendario (ICS)',
						name: 'calendarEvent',
						type: 'string',
						default: '',
						placeholder: 'Pega aquí el contenido ICS',
						description: 'Contenido del archivo .ics para enviar como invitación de calendario',
					},
					{
						displayName: 'Fecha Personalizada',
						name: 'date',
						type: 'dateTime',
						default: '',
						description: 'Fecha personalizada para el correo',
					},
					{
						displayName: 'Ignorar Problemas SSL (Inseguro)',
						name: 'allowUnauthorizedCerts',
						type: 'boolean',
						default: false,
						description: 'Whether to connect even if SSL certificate validation is not possible',
					},
					{
						displayName: 'In-Reply-To',
						name: 'inReplyTo',
						type: 'string',
						default: '',
						description: 'Message-ID al que responde este correo',
					},
					{
						displayName: 'Incluir créditos del autor',
						name: 'appendCredits',
						type: 'boolean',
						default: false,
						description: 'Whether to add a credit line at the end of the email',
					},
					{
						displayName: 'Prioridad',
						name: 'priority',
						type: 'options',
						options: [
							{ name: 'Normal', value: 'normal' },
							{ name: 'Alta', value: 'high' },
							{ name: 'Baja', value: 'low' },
						],
						default: 'normal',
						description: 'Prioridad del correo electrónico',
					},
					{
						displayName: 'Referencias',
						name: 'references',
						type: 'string',
						default: '',
						description: 'IDs de mensajes previos, separados por comas',
					},
					{
						displayName: 'Reply-To Email',
						name: 'replyTo',
						type: 'string',
						default: '',
						placeholder: 'info@ejemplo.com',
						description: 'Dirección de correo electrónico para responder',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('smtp');

		const transporter = nodemailer.createTransport({
			host: credentials.host as string,
			port: credentials.port as number,
			secure: credentials.secure as boolean,
			auth: {
				user: credentials.user as string,
				pass: credentials.password as string,
			},
			tls: credentials.allowUnauthorizedCerts ? { rejectUnauthorized: false } : {},
		});
		const parseEmails = (input: string | undefined): string | undefined =>
			typeof input === 'string'
				? input
						.split(',')
						.map((e) => e.trim())
						.filter(Boolean)
						.join(', ')
				: undefined;

		for (let i = 0; i < items.length; i++) {
			try {
				const from = this.getNodeParameter('fromEmail', i) as string;
				const to = this.getNodeParameter('toEmail', i) as string;
				const subject = this.getNodeParameter('subject', i) as string;
				const emailFormat = this.getNodeParameter('emailFormat', i) as string;
				const text = this.getNodeParameter('text', i, '') as string;
				const html = this.getNodeParameter('html', i, '') as string;

				const customHeadersStr = this.getNodeParameter('customHeaders', i, '') as string;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;

				const mailOptions: IDataObject = {
					from,
					to: parseEmails(to),
					subject,
				};

				if (emailFormat === 'text') {
					mailOptions.text = text;
				} else if (emailFormat === 'html') {
					mailOptions.html = html;
				} else if (emailFormat === 'both') {
					mailOptions.text = text;
					mailOptions.html = html;
				}

				const enableCustomHeaders = this.getNodeParameter(
					'enableCustomHeaders',
					i,
					false,
				) as boolean;
				let headers: Record<string, string> = {};

				if (enableCustomHeaders) {
					if (customHeadersStr.trim()) {
						try {
							headers = JSON.parse(customHeadersStr);
						} catch (error) {
							throw new NodeApiError(this.getNode(), {
								message: 'Custom Headers must be valid JSON',
							});
						}
					}
					if (Object.keys(headers).length > 0) {
						mailOptions.headers = Object.fromEntries(
							Object.entries(headers).map(([key, value]) => [key, String(value)]),
						);
					}
				}

				if (options.adjuntos && items[i].binary) {
					const attachments = [];
					const attachmentProperties: string[] = (options.adjuntos as string)
						.split(',')
						.map((propertyName) => propertyName.trim())
						.filter(Boolean);

					for (const propertyName of attachmentProperties) {
						const binaryData = this.helpers.assertBinaryData(i, propertyName);
						attachments.push({
							filename: binaryData.fileName || propertyName,
							content: await this.helpers.getBinaryDataBuffer(i, propertyName),
							cid: propertyName,
						});
					}

					if (attachments.length) {
						mailOptions.attachments = attachments;
					}
				}

				if (options.priority) {
					mailOptions.priority = options.priority;
				}

				if (options.inReplyTo) {
					mailOptions.inReplyTo = options.inReplyTo;
				}
				if (options.references) {
					if (typeof options.references === 'string') {
						mailOptions.references = options.references.split(',').map((id: string) => id.trim());
					}
				}
				if (options.date) {
					mailOptions.date = new Date(options.date as string);
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
					if (mailOptions.text) {
						mailOptions.text += '\n\n---\nDesarrollado por Cristianemek';
					}
					if (mailOptions.html) {
						mailOptions.html += '<br><br>---<br>Desarrollado por Cristianemek';
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

				if (options.testMode && options.testEmail) {
					mailOptions.to = options.testEmail;
					delete mailOptions.cc;
					delete mailOptions.bcc;
					delete mailOptions.replyTo;

					mailOptions.subject = `[PRUEBA] ${subject}`;
				}

				const info = await transporter.sendMail(mailOptions);

				returnData.push({
					json: {
						...info,
						testMode: !!options.testMode,
						originalRecipient: options.testMode
							? {
									to,
									cc: options.ccEmail || '',
									bcc: options.bccEmail || '',
									replyTo: options.replyTo || '',
								}
							: undefined,
					} as unknown as IDataObject,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				delete error.cert;
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}
		return [returnData];
	}
}
