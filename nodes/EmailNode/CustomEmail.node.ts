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
        displayName: 'Message',
        name: 'message',
        type: 'string',
        typeOptions: {
          rows: 5,
        },
        default: '',
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
      tls: credentials.allowUnauthorizedCerts
        ? { rejectUnauthorized: false }
        : {},
    });

    for (let i = 0; i < items.length; i++) {
      const to = this.getNodeParameter('toEmail', i) as string;
      const subject = this.getNodeParameter('subject', i) as string;
      const message = this.getNodeParameter('message', i) as string;
      const customHeadersStr = this.getNodeParameter('customHeaders', i) as string;

      let headers: Record<string, string> = {};
      if (customHeadersStr.trim()) {
        try {
          headers = JSON.parse(customHeadersStr);
        } catch (error) {
          throw new Error('Custom Headers must be valid JSON');
        }
      }

      const mailOptions = {
        from: credentials.user?.toString(),
        to,
        subject,
        text: message,
        headers,
      };

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
