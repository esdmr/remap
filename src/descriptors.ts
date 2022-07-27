export const publicProperty: Readonly<PropertyDescriptor> = {
	configurable: false,
};

export const readonlyProperty: Readonly<PropertyDescriptor> = {
	writable: false,
	configurable: false,
};
