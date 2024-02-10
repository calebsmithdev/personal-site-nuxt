const assets = import.meta.glob('~/assets/img/**/*', {
	import: 'default',
	eager: true,
});

export const useAsset = (src: string) => {
	return assets[src]?.toString() || src;
};