import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	NodeConnectionType,
} from 'n8n-workflow';

import nodemailer from 'nodemailer';

export class CustomEmailSend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Custom Email Send',
		name: 'customEmailSend',
		icon: 'fa:envelope',
		group: ['output'],
		version: 1,
		description: 'Send emails using SMTP with custom headers',
		defaults: {
			name: 'Send Email Custom',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [
			{
				name: 'smtp',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'From Email',
				name: 'fromEmail',
				type: 'string',
				default: '',
				required: true,
			},
			{
				displayName: 'To Email',
				name: 'toEmail',
				type: 'string',
				default: '',
				required: true,
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Email Format',
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
				default: 'text',
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
				displayName: 'Custom Headers (JSON)',
				name: 'customHeaders',
				type: 'string',
				default: '',
				placeholder: '{"List-Unsubscribe": "<mailto:unsubscribe@example.com>"}',
				description: 'Additional headers in JSON format',
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
			const from = this.getNodeParameter('fromEmail', i) as string;
			const to = this.getNodeParameter('toEmail', i) as string;
			const subject = this.getNodeParameter('subject', i) as string;
			const emailFormat = this.getNodeParameter('emailFormat', i) as string;
			const text = this.getNodeParameter('text', i, '') as string;
			const html = this.getNodeParameter('html', i, '') as string;
			const customHeadersStr = this.getNodeParameter('customHeaders', i) as string;

			let headers: Record<string, string> = {};
			if (customHeadersStr.trim()) {
				try {
					headers = JSON.parse(customHeadersStr);
				} catch (error) {
					throw new Error('Custom Headers must be valid JSON');
				}
			}

			const mailOptions: any = {
				from,
				to,
				subject,
				headers,
			};

			if (emailFormat === 'text') {
				mailOptions.text = text;
			} else if (emailFormat === 'html') {
				mailOptions.html = html;
			} else if (emailFormat === 'both') {
				mailOptions.text = text;
				mailOptions.html = html;
			}

			const info = await transporter.sendMail(mailOptions);

			returnData.push({
				json: {
					success: true,
					messageId: info.messageId,
					envelope: info.envelope,
				},
			});
		}

		return [returnData];
	}
}
