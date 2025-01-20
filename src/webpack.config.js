import { URL } from 'url';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import { hashElement } from 'folder-hash';
export default async () => {
	return {
		entry: {
			clientscripts: './client.js',
			serviceworker: './serviceworker.js',
		},
		output: {
			filename: '[name].js',
			path: new URL('./bin/', import.meta.url).pathname,
		},
		plugins: [
			// Get the hashes of all the resources & templates to embed in a comment in service worker
			new webpack.BannerPlugin({
				banner: `Resource Hash: ${(await hashElement("./style.css")).hash}\nClient JS Hash: ${(await hashElement("./client.js")).hash}\nTemplate Hash: ${(await hashElement("./templates")).hash}`,
				include: 'serviceworker',
			}),
		],
		optimization: {
			// Stop the terser plugin messing with the banner plugin
			minimizer: [new TerserPlugin({
				extractComments: false,
			})],
		},
		mode: 'production',
	};
};
