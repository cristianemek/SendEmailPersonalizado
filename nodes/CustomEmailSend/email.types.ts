// Email format constants
export const EMAIL_FORMATS = {
	TEXT: 'text',
	HTML: 'html',
	BOTH: 'both'
} as const;

// Priority constants
export const PRIORITIES = {
	NORMAL: 'normal',
	HIGH: 'high',
	LOW: 'low'
} as const;

// Default headers for email marketing compliance
export const DEFAULT_HEADERS = {
	"List-Unsubscribe": "<mailto:unsubscribe@example.com>",
	"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
};

// Type definitions
export type EmailFormat = typeof EMAIL_FORMATS[keyof typeof EMAIL_FORMATS];
export type Priority = typeof PRIORITIES[keyof typeof PRIORITIES];

export interface EmailValidationOptions {
	maxLength?: number;
	required?: boolean;
}

export interface AttachmentInfo {
	filename: string;
	content: Buffer;
	cid: string;
}
