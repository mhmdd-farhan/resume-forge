import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Deep-clone a plain JSON-safe value (resume data never contains Dates etc.). */
export function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}