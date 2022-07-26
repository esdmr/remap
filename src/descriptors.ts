export const publicProperty: Readonly<PropertyDescriptor> = {
	configurable: false,
};

export const readonlyProperty: Readonly<PropertyDescriptor> = {
	writable: false,
	configurable: false,
};

export const privateReadonlyProperty: Readonly<PropertyDescriptor> = {
	writable: false,
	enumerable: false,
	configurable: false,
};
