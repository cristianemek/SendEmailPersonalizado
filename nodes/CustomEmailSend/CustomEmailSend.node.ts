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
import { 
	EMAIL_FORMATS, 
	PRIORITIES, 
	DEFAULT_HEADERS 
} from './email.types';
import {
	validateEmail,
	validateEmailList,
	processEmailItem,
} from './email.utils';

/**
 * Build return data for successful email send
 */
const buildReturnData = (
	info: any,
	testMode: boolean,
	options: IDataObject,
	to: string,
	itemIndex: number
): INodeExecutionData => {
	return {
		json: {
			...info,
			testMode: !!testMode,
			originalRecipient: testMode
				? {
						to,
						cc: options.ccEmail || '',
						bcc: options.bccEmail || '',
						replyTo: options.replyTo || '',
					}
				: undefined,
		} as unknown as IDataObject,
		pairedItem: { item: itemIndex },
	};
};

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
						validate: validateEmailList,
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
						value: EMAIL_FORMATS.TEXT,
						description: 'Enviar solo texto plano',
					},
					{
						name: 'HTML',
						value: EMAIL_FORMATS.HTML,
						description: 'Enviar solo HTML',
					},
					{
						name: 'Ambos',
						value: EMAIL_FORMATS.BOTH,
						description: 'Enviar ambos formatos',
					},
				],
				default: EMAIL_FORMATS.HTML,
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
						emailFormat: [EMAIL_FORMATS.TEXT, EMAIL_FORMATS.BOTH],
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
						emailFormat: [EMAIL_FORMATS.HTML, EMAIL_FORMATS.BOTH],
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
				default: JSON.stringify(DEFAULT_HEADERS, null, 2),
				placeholder: JSON.stringify(DEFAULT_HEADERS, null, 2),
				description:
					'Encabezados personalizados en formato JSON. Por ejemplo: {"List-Unsubscribe": "&lt;mailto:unsubscribe@example.com&gt;"}. Puedes editar o borrar estos encabezados si lo deseas.',
				displayOptions: {
					show: {
						enableCustomHeaders: [true],
					},
				},
			},
			{
				displayName: 'Modo De Prueba',
				name: 'testMode',
				type: 'boolean',
				default: false,
				description: 'Whether to send test emails to a specific address instead of real recipients',
			},
			{
				displayName: 'Email De Prueba',
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
							return validateEmail(value.trim());
						},
					},
				},
			},
			{
				displayName: 'Prefijo del asunto',
				name: 'testSubjectPrefix',
				type: 'string',
				default: '[TEST]',
				placeholder: '[TEST] (vacío = sin prefijo)',
				description:
					'Prefijo que se agregará al asunto. Si está vacío, se enviará el asunto original sin modificar.',
				displayOptions: {
					show: {
						testMode: [true],
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
							{ name: 'Normal', value: PRIORITIES.NORMAL },
							{ name: 'Alta', value: PRIORITIES.HIGH },
							{ name: 'Baja', value: PRIORITIES.LOW },
						],
						default: PRIORITIES.NORMAL,
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

		for (let i = 0; i < items.length; i++) {
			try {
				const result = await processEmailItem(this, transporter, i);
				returnData.push(buildReturnData(result.info, result.testMode, result.options, result.to, i));
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
