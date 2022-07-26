export const readable: Readonly<PropertyDescriptor> = {
	configurable: false,
};

export const readonly: Readonly<PropertyDescriptor> = {
	writable: false,
	configurable: false,
};

export const privateReadonly: Readonly<PropertyDescriptor> = {
	writable: false,
	enumerable: false,
	configurable: false,
};
